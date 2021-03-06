(function(exports, global) {
    global["eeh-navigation"] = exports;
    "use strict";
    angular.module("eehNavigation", [ "pascalprecht.translate" ]);
    "use strict";
    var MenuItem = function(config) {
        this.weight = 0;
        angular.extend(this, config);
    };
    MenuItem.prototype.children = function() {
        var children = [];
        angular.forEach(this, function(property) {
            if (angular.isObject(property) && property instanceof MenuItem) {
                children.push(property);
            }
        });
        return children;
    };
    MenuItem.prototype.hasChildren = function() {
        return this.children().length > 0;
    };
    MenuItem.prototype._isVisible = function() {
        var hasVisibleChildren = this.children().filter(function(child) {
            return child._isVisible() !== false;
        }).length > 0;
        if (!hasVisibleChildren && angular.isUndefined(this.state) && angular.isUndefined(this.href) && angular.isUndefined(this.click) && !this.isDivider) {
            return false;
        }
        if (angular.isFunction(this.isVisible)) {
            return this.isVisible();
        }
        if (angular.isDefined(this.isVisible)) {
            return this.isVisible;
        }
        return true;
    };
    MenuItem.prototype.isVisible = function() {
        return true;
    };
    MenuItem.prototype.isHeavy = function() {
        if (this.hasOwnProperty("weight")) {
            return this.weight >= 0;
        }
    };
    "use strict";
    var NavigationService = function() {
        this._iconBaseClass = "glyphicon";
        this._sidebarTextCollapse = {
            isVisible: true,
            isCollapsed: false
        };
        this.navbarBrand = this._navbarBrand = {
            text: "",
            state: "",
            href: "",
            src: ""
        };
        this._menuItems = {};
        this._navbarMenuItems = {};
        this._sidebarMenuItems = {};
        this._toArray = function(items) {
            var arr = [];
            for (var key in items) {
                if (items.hasOwnProperty(key)) {
                    arr.push(items[key]);
                }
            }
            return arr;
        };
    };
    NavigationService.prototype.$get = function() {
        return this;
    };
    NavigationService.prototype.iconBaseClass = function(value) {
        if (angular.isUndefined(value)) {
            return this._iconBaseClass;
        }
        this._iconBaseClass = value;
        return this;
    };
    NavigationService.prototype.buildAncestorChain = function(name, items, config) {
        var keys = name.split(".");
        if (name.length === 0 || keys.length === 0) {
            return;
        }
        var key = keys.shift();
        if (angular.isUndefined(items[key])) {
            items[key] = keys.length === 0 ? config : {};
            if (keys.length === 0) {
                items[key] = config;
            }
        }
        this.buildAncestorChain(keys.join("."), items[key], config);
    };
    NavigationService.prototype.menuItemTree = function(rootMenuName) {
        var items = {};
        var self = this;
        var menuItemsToTransform = {};
        if (angular.isDefined(rootMenuName)) {
            var rootMenuNameRegex = new RegExp("^" + rootMenuName + ".");
            angular.forEach(this._menuItems, function(menuItem, menuItemName) {
                if (menuItemName.match(rootMenuNameRegex) !== null) {
                    menuItemsToTransform[menuItemName.replace(rootMenuNameRegex, "")] = menuItem;
                }
            });
        } else {
            menuItemsToTransform = this._menuItems;
        }
        angular.forEach(menuItemsToTransform, function(config, name) {
            self.buildAncestorChain(name, items, config);
        });
        return this._toArray(items);
    };
    NavigationService.prototype.menuItem = function(name, config) {
        if (angular.isUndefined(config)) {
            if (angular.isUndefined(this._menuItems[name])) {
                throw name + " is not a menu item";
            }
            return this._menuItems[name];
        }
        this._menuItems[name] = new MenuItem(config);
        return this;
    };
    NavigationService.prototype.menuItems = function() {
        return this._menuItems;
    };
    NavigationService.prototype.sidebarTextCollapseIsVisible = function(value) {
        if (angular.isUndefined(value)) {
            return this._sidebarTextCollapse.isVisible;
        }
        this._sidebarTextCollapse.isVisible = value;
        return this;
    };
    NavigationService.prototype.sidebarTextCollapseIsCollapsed = function(value) {
        if (angular.isUndefined(value)) {
            return this._sidebarTextCollapse.isCollapsed;
        }
        this._sidebarTextCollapse.isCollapsed = value;
        return this;
    };
    NavigationService.prototype.sidebarTextCollapseToggleCollapsed = function() {
        this._sidebarTextCollapse.isCollapsed = !this._sidebarTextCollapse.isCollapsed;
        return this;
    };
    angular.module("eehNavigation").provider("eehNavigation", NavigationService);
    "use strict";
    var MenuItemContentDirective = function(eehNavigation) {
        return {
            restrict: "A",
            scope: {
                menuItem: "=eehNavigationMenuItemContent"
            },
            templateUrl: "template/eeh-navigation/menu-item-content/eeh-navigation-menu-item-content.html",
            link: function(scope) {
                scope.iconBaseClass = function() {
                    return eehNavigation.iconBaseClass();
                };
            }
        };
    };
    MenuItemContentDirective.$inject = [ "eehNavigation" ];
    angular.module("eehNavigation").directive("eehNavigationMenuItemContent", MenuItemContentDirective);
    "use strict";
    var ActiveParentMenuItemDirective = function($state) {
        return {
            restrict: "A",
            scope: {
                menuItem: "=eehNavigationActiveMenuItem"
            },
            link: function(scope, element) {
                var checkIsActive = function() {
                    if (scope.menuItem.hasChildren()) {
                        var isActive = scope.menuItem.children().filter(function(childMenuItem) {
                            return angular.isDefined(childMenuItem.state) && $state.includes(childMenuItem.state);
                        }).length > 0;
                        element.toggleClass("active", isActive);
                    }
                };
                scope.$on("$stateChangeSuccess", checkIsActive);
                checkIsActive();
            }
        };
    };
    ActiveParentMenuItemDirective.$inject = [ "$state" ];
    angular.module("eehNavigation").directive("eehNavigationActiveMenuItem", ActiveParentMenuItemDirective);
    "use strict";
    var NavbarDirective = function($window, eehNavigation) {
        return {
            restrict: "AE",
            templateUrl: "template/eeh-navigation/navbar/eeh-navigation-navbar.html",
            scope: {
                rootMenuName: "=rootMenuName"
            },
            link: function(scope) {
                scope.iconBaseClass = function() {
                    return eehNavigation.iconBaseClass();
                };
                scope._navbarBrand = eehNavigation._navbarBrand;
                scope.isNavbarCollapsed = false;
                var menuItems = function() {
                    return eehNavigation.menuItems();
                };
                scope.$watch(menuItems, function() {
                    var menuItems = eehNavigation.menuItemTree(scope.rootMenuName);
                    scope.leftNavbarMenuItems = menuItems.filter(function(item) {
                        return !item.isHeavy();
                    });
                    scope.rightNavbarMenuItems = menuItems.filter(function(item) {
                        return item.isHeavy();
                    });
                });
                var windowElement = angular.element($window);
                windowElement.bind("resize", function() {
                    scope.$apply();
                });
                var getWindowDimensions = function() {
                    return {
                        height: windowElement.height(),
                        width: windowElement.width(),
                        innerHeight: windowElement.innerHeight(),
                        innerWidth: windowElement.innerWidth()
                    };
                };
                scope.$watch(getWindowDimensions, function(newValue) {
                    if (angular.isUndefined(newValue)) {
                        return;
                    }
                    var width = newValue.innerWidth > 0 ? newValue.innerWidth : $window.screen.width;
                    if (width >= 768) {
                        scope.isNavbarCollapsed = false;
                    }
                }, true);
            }
        };
    };
    angular.module("eehNavigation").directive("eehNavigationNavbar", [ "$window", "eehNavigation", NavbarDirective ]);
    "use strict";
    var SidebarDirective = function($window, eehNavigation) {
        return {
            restrict: "AE",
            transclude: true,
            templateUrl: "template/eeh-navigation/search-input/eeh-navigation-search-input.html",
            scope: {
                searchIconClass: "@",
                searchTerm: "=",
                submit: "="
            },
            link: function(scope) {
                scope.searchIconClass = scope.searchIconClass || "glyphicon-search";
                scope.iconBaseClass = function() {
                    return eehNavigation.iconBaseClass();
                };
                scope._sidebarSearch = eehNavigation._sidebarSearch;
            }
        };
    };
    angular.module("eehNavigation").directive("eehNavigationSearchInput", [ "$window", "eehNavigation", SidebarDirective ]);
    "use strict";
    var SidebarDirective = function($window, eehNavigation) {
        return {
            restrict: "AE",
            transclude: true,
            templateUrl: "template/eeh-navigation/sidebar/eeh-navigation-sidebar.html",
            scope: {
                rootMenuName: "=",
                topOffset: "@",
                collapsedMenuItemIconClass: "@",
                expandedMenuItemIconClass: "@",
                collapsedSidebarIconClass: "@",
                expandedSidebarIconClass: "@",
                searchInputIsVisible: "@",
                searchInputModel: "@",
                searchInputSubmit: "@"
            },
            link: function(scope, element) {
                scope.topOffset = scope.topOffset || 51;
                scope.collapsedMenuItemIconClass = scope.collapsedMenuItemIconClass || "glyphicon-chevron-left";
                scope.expandedMenuItemIconClass = scope.expandedMenuItemIconClass || "glyphicon-chevron-down";
                scope.collapsedSidebarIconClass = scope.collapsedSidebarIconClass || "glyphicon-arrow-right";
                scope.expandedSidebarIconClass = scope.expandedSidebarIconClass || "glyphicon-arrow-left";
                scope.iconBaseClass = function() {
                    return eehNavigation.iconBaseClass();
                };
                scope._sidebarTextCollapse = eehNavigation._sidebarTextCollapse;
                var menuItems = function() {
                    return eehNavigation.menuItems();
                };
                scope.$watch(menuItems, function() {
                    scope.sidebarMenuItems = eehNavigation.menuItemTree(scope.rootMenuName);
                });
                var windowElement = angular.element($window);
                windowElement.bind("resize", function() {
                    scope.$apply();
                });
                var getWindowDimensions = function() {
                    return {
                        height: windowElement.height(),
                        width: windowElement.width(),
                        innerHeight: windowElement.innerHeight(),
                        innerWidth: windowElement.innerWidth()
                    };
                };
                var transcludedWrapper = element.find("#eeh-navigation-page-wrapper");
                scope.$watch(getWindowDimensions, function(newValue) {
                    if (angular.isUndefined(newValue)) {
                        return;
                    }
                    var height = newValue.innerHeight > 0 ? newValue.innerHeight : $window.screen.height;
                    height = height - scope.topOffset;
                    if (height < 1) {
                        height = 1;
                    }
                    if (height > scope.topOffset) {
                        transcludedWrapper.css("min-height", height + "px");
                    }
                }, true);
                scope.toggleSidebarTextCollapse = function() {
                    eehNavigation.sidebarTextCollapseToggleCollapsed();
                    setTextCollapseState();
                };
                function setTextCollapseState() {
                    var sidebarMenuItemTextElements = element.find(".menu-item-text");
                    var sidebarElement = element.find(".eeh-navigation-sidebar");
                    if (eehNavigation.sidebarTextCollapseIsCollapsed()) {
                        transcludedWrapper.addClass("sidebar-text-collapsed");
                        sidebarElement.addClass("sidebar-text-collapsed");
                        sidebarMenuItemTextElements.addClass("hidden");
                    } else {
                        transcludedWrapper.removeClass("sidebar-text-collapsed");
                        sidebarElement.removeClass("sidebar-text-collapsed");
                        sidebarMenuItemTextElements.removeClass("hidden");
                    }
                }
                scope.$on("$includeContentLoaded", function() {
                    setTextCollapseState();
                });
                scope.isSidebarVisible = function() {
                    return scope.searchInputIsVisible || angular.isArray(scope.sidebarMenuItems) && scope.sidebarMenuItems.filter(function(item) {
                        return item._isVisible();
                    }).length > 0;
                };
            }
        };
    };
    angular.module("eehNavigation").directive("eehNavigationSidebar", [ "$window", "eehNavigation", SidebarDirective ]);
})({}, function() {
    return this;
}());