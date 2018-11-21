angular.module('angularResizable', [])
    .directive('resizable', function() {
        var toCall;
        function throttle(fun) {
            if (toCall === undefined) {
                toCall = fun;
                setTimeout(function() {
                    toCall();
                    toCall = undefined;
                }, 100);
            } else {
                toCall = fun;
            }
        }
        return {
            restrict: 'AE',
            scope: {
                rDirections: '=',
                rCenteredX: '=',
                rCenteredY: '=',
                rWidth: '=',
                rHeight: '=',
                rFlex: '=',
                rGrabber: '@',
                rDisabled: '@',
                rNoThrottle: '=',
                resizable: '@',
            },
            link: function(scope, element, attr) {
                if (scope.resizable === 'false') return;

                var flexBasis = 'flexBasis' in document.documentElement.style ? 'flexBasis' :
                    'webkitFlexBasis' in document.documentElement.style ? 'webkitFlexBasis' :
                    'msFlexPreferredSize' in document.documentElement.style ? 'msFlexPreferredSize' : 'flexBasis';

                // register watchers on width and height attributes if they are set
                scope.$watch('rWidth', function(value){
                    element[0].style[scope.rFlex ? flexBasis : 'width'] = scope.rWidth + 'px';
                });
                scope.$watch('rHeight', function(value){
                    element[0].style[scope.rFlex ? flexBasis : 'height'] = scope.rHeight + 'px';
                });

                element.addClass('resizable');

                var style = window.getComputedStyle(element[0], null),
                    w,
                    h,
                    dir = scope.rDirections || ['right'],
                    vx = scope.rCenteredX ? 2 : 1, // if centered double velocity
                    vy = scope.rCenteredY ? 2 : 1, // if centered double velocity
                    inner = scope.rGrabber ? scope.rGrabber : '<span></span>',
                    start,
                    dragDir,
                    axis,
                    info = {};

                var updateInfo = function(e) {
                    info.width = false;
                    info.height = false;
                    if (axis.x) {
                        info.width = parseInt(element[0].style[scope.rFlex ? flexBasis : 'width']);
                    }
                    if (axis.y) {
                        info.height = parseInt(element[0].style[scope.rFlex ? flexBasis : 'height']);
                    }
                    info.id = element[0].id;
                    info.evt = e;
                };

                var getClientX = function(e) {
                    return e.touches ? e.touches[0].clientX : e.clientX;
                };

                var getClientY = function(e) {
                    return e.touches ? e.touches[0].clientY : e.clientY;
                };

                var dragging = function(e) {
                    var prop;
                    var offset = {
                        x: start.x - getClientX(e),
                        y: start.y - getClientY(e)
                    };
                    
                    if (/left/.test(dragDir)) {
                        prop = scope.rFlex ? flexBasis : 'width';
                        element[0].style[prop] = w + (offset.x * vx) + 'px';
                    }
                    if (/right/.test(dragDir)) {
                        prop = scope.rFlex ? flexBasis : 'width';
                        element[0].style[prop] = w - (offset.x * vx) + 'px';
                    }
                    if (/top/.test(dragDir)) {
                        prop = scope.rFlex ? flexBasis : 'height';
                        element[0].style[prop] = h + (offset.y * vy) + 'px';
                    }
                    if (/bottom/.test(dragDir)) {
                        prop = scope.rFlex ? flexBasis : 'height';
                        element[0].style[prop] = h - (offset.y * vy) + 'px';
                    }
                    
                    updateInfo(e);
                    function resizingEmit(){
                        scope.$emit('angular-resizable.resizing', info);
                    }
                    if (scope.rNoThrottle) {
                        resizingEmit();
                    } else {
                        throttle(resizingEmit);
                    }
                };
                var dragEnd = function(e) {
                    updateInfo(e);
                    scope.$emit('angular-resizable.resizeEnd', info);
                    scope.$apply();
                    document.removeEventListener('mouseup', dragEnd, false);
                    document.removeEventListener('mousemove', dragging, false);
                    document.removeEventListener('touchend', dragEnd, false);
                    document.removeEventListener('touchmove', dragging, false);
                    element.removeClass('no-transition');
                };
                var dragStart = function(e, direction) {
                    dragDir = direction;
                    axis = {};
                    if (/left|right/.test(dragDir)) {
                        axis.x = true;
                    }
                    if (/top|bottom/.test(dragDir)) {
                        axis.y = true;
                    }
                    start = {
                        x: getClientX(e),
                        y: getClientY(e)
                    };
                    
                    if (scope.rFlex) {
                        w = parseInt(style.getPropertyValue('flex-basis')) || 0;
                    }
                    if (!scope.rFlex || w == 0) {
                        w = parseInt(style.getPropertyValue('width'));
                    }
                    if (scope.rFlex) {
                        h = parseInt(style.getPropertyValue('flex-basis')) || 0;
                    }
                    if (!scope.rFlex || h == 0) {
                        h = parseInt(style.getPropertyValue('height'));
                    }

                    //prevent transition while dragging
                    element.addClass('no-transition');

                    document.addEventListener('mouseup', dragEnd, false);
                    document.addEventListener('mousemove', dragging, false);
                    document.addEventListener('touchend', dragEnd, false);
                    document.addEventListener('touchmove', dragging, false);

                    // Disable highlighting while dragging
                    if(e.stopPropagation) e.stopPropagation();
                    if(e.preventDefault) e.preventDefault();
                    e.cancelBubble = true;
                    e.returnValue = false;

                    updateInfo(e);
                    scope.$emit('angular-resizable.resizeStart', info);
                    scope.$apply();
                };

                dir.forEach(function (direction) {
                    var grabber = document.createElement('div');

                    // add class for styling purposes
                    grabber.setAttribute('class', 'rg-' + direction);
                    grabber.innerHTML = inner;
                    element[0].appendChild(grabber);
                    grabber.ondragstart = function() { return false; };
                    grabber.addEventListener("click", function(e) { e.stopPropagation(); return false; });

                    var down = function(e) {
                        var disabled = (scope.rDisabled === 'true');
                        if (!disabled && (e.which === 1 || e.touches)) {
                            // left mouse click or touch screen
                            dragStart(e, direction);
                        }
                    };
                    angular.element(grabber).on('mousedown', down);
                    angular.element(grabber).on('touchstart', down);
                });
            }
        };
    });
