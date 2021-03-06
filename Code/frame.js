/*
  The frame is a container for a panel, and can contain multiple panels inside it, each appearing
  as a tabbed item.  All docking panels have a frame, but the frame can change any time the panel
  is moved.
*/
function wcFrame(container, parent, isFloating) {
  this.$container = $(container);
  this._parent = parent;
  this._isFloating = isFloating;

  this.$frame   = null;
  this.$title   = null;
  this.$center  = null;
  this.$close   = null;
  this.$top     = null;
  this.$bottom  = null;
  this.$left    = null;
  this.$right   = null;
  this.$corner1 = null;
  this.$corner2 = null;
  this.$corner3 = null;
  this.$corner4 = null;

  this.$shadower = null;

  this._curTab = -1;
  this._panelList = [];
  this._buttonList = [];

  this._pos = {
    x: 0.5,
    y: 0.5,
  };

  this._size = {
    x: 400,
    y: 400,
  };

  this._anchorMouse = {
    x: 0,
    y: 0,
  };

  this.__init();
};

wcFrame.prototype = {
///////////////////////////////////////////////////////////////////////////////////////////////////////
// Public Functions
///////////////////////////////////////////////////////////////////////////////////////////////////////

  // Gets, or Sets the position of the frame.
  // Params:
  //    x, y    If supplied, assigns the new position.
  //    pixels  If true, the coordinates given will be treated as a
  //            pixel position rather than a percentage.
  pos: function(x, y, pixels) {
    var width = this.$container.width();
    var height = this.$container.height();

    if (typeof x === 'undefined') {
      if (pixels) {
        return {x: this._pos.x*width, y: this._pos.y*height};
      } else {
        return {x: this._pos.x, y: this._pos.y};
      }
    }

    if (pixels) {
      this._pos.x = x/width;
      this._pos.y = y/height;
    } else {
      this._pos.x = x;
      this._pos.y = y;
    }
  },

  // Gets the desired size of the panel.
  initSize: function() {
    var size = {
      x: -1,
      y: -1,
    };

    for (var i = 0; i < this._panelList.length; ++i) {
      if (size.x < this._panelList[i].initSize().x) {
        size.x = this._panelList[i].initSize().x;
      }
      if (size.y < this._panelList[i].initSize().y) {
        size.y = this._panelList[i].initSize().y;
      }
    }

    if (size.x < 0 || size.y < 0) {
      return false;
    }
    return size;
  },

  // Gets the minimum size of the panel.
  minSize: function() {
    var size = {
      x: 0,
      y: 0,
    };

    for (var i = 0; i < this._panelList.length; ++i) {
      size.x = Math.max(size.x, this._panelList[i].minSize().x);
      size.y = Math.max(size.y, this._panelList[i].minSize().y);
    }
    return size;
  },

  // Gets the minimum size of the panel.
  maxSize: function() {
    var size = {
      x: Infinity,
      y: Infinity,
    };

    for (var i = 0; i < this._panelList.length; ++i) {
      size.x = Math.min(size.x, this._panelList[i].maxSize().x);
      size.y = Math.min(size.y, this._panelList[i].maxSize().y);
    }
    return size;
  },

  // Adds a given panel as a new tab item.
  // Params:
  //    panel    The panel to add.
  //    index     An optional index to insert the tab at.
  addPanel: function(panel, index) {
    var found = this._panelList.indexOf(panel);
    if (found !== -1) {
      this._panelList.splice(found, 1);
    }

    if (typeof index === 'undefined') {
      this._panelList.push(panel);
    } else {
      this._panelList.splice(index, 0, panel);
    }

    if (this._curTab === -1 && this._panelList.length) {
      this._curTab = 0;
    }

    this._size = this.initSize();
    this.__updateTabs();
  },

  // Removes a given panel from the tab item.
  // Params:
  //    panel       The panel to remove.
  // Returns:
  //    bool        Returns whether or not any panels still remain.
  removePanel: function(panel) {
    for (var i = 0; i < this._panelList.length; ++i) {
      if (this._panelList[i] === panel) {
        if (this._curTab >= i) {
          this._curTab--;
        }

        this._panelList[i].__container(null);
        this._panelList[i]._parent = null;

        this._panelList.splice(i, 1);
        break;
      }
    }

    if (this._curTab === -1 && this._panelList.length) {
      this._curTab = 0;
    }

    this.__updateTabs();
    return this._panelList.length > 0;
  },

  // Gets, or Sets the currently visible panel.
  // Params:
  //    tabIndex      If supplied, sets the current tab.
  // Returns:
  //    wcPanel       The currently visible panel.
  panel: function(tabIndex) {
    if (tabIndex !== 'undefined') {
      if (tabIndex > -1 && tabIndex < this._panelList.length) {
        this.$title.find('div[id="' + this._curTab + '"]').removeClass('wcPanelTabActive');
        this.$center.find('.wcPanelTabContent[id="' + this._curTab + '"]').addClass('wcPanelTabContentHidden');
        this._curTab = tabIndex;
        this.$title.find('div[id="' + tabIndex + '"]').addClass('wcPanelTabActive');
        this.$center.find('.wcPanelTabContent[id="' + tabIndex + '"]').removeClass('wcPanelTabContentHidden');
        this.__onTabChange();
      }
    }

    if (this._curTab > -1 && this._curTab < this._panelList.length) {
      return this._panelList[this._curTab];
    }
    return false;
  },


///////////////////////////////////////////////////////////////////////////////////////////////////////
// Private Functions
///////////////////////////////////////////////////////////////////////////////////////////////////////

  // Initialize
  __init: function() {
    this.$frame   = $('<div class="wcFrame wcWide wcTall wcPanelBackground">');
    this.$title   = $('<div class="wcFrameTitle">');
    this.$center  = $('<div class="wcFrameCenter wcWide">');
    this.$close   = $('<div class="wcFrameButton">X</div>');
    this.$frame.append(this.$title);
    this.$frame.append(this.$close);

    if (this._isFloating) {
      this.$top     = $('<div class="wcFrameEdgeH wcFrameEdge"></div>').css('top', '-6px').css('left', '0px').css('right', '0px');
      this.$bottom  = $('<div class="wcFrameEdgeH wcFrameEdge"></div>').css('bottom', '-6px').css('left', '0px').css('right', '0px');
      this.$left    = $('<div class="wcFrameEdgeV wcFrameEdge"></div>').css('left', '-6px').css('top', '0px').css('bottom', '0px');
      this.$right   = $('<div class="wcFrameEdgeV wcFrameEdge"></div>').css('right', '-6px').css('top', '0px').css('bottom', '0px');
      this.$corner1 = $('<div class="wcFrameCornerNW wcFrameEdge"></div>').css('top', '-6px').css('left', '-6px');
      this.$corner2 = $('<div class="wcFrameCornerNE wcFrameEdge"></div>').css('top', '-6px').css('right', '-6px');
      this.$corner3 = $('<div class="wcFrameCornerNW wcFrameEdge"></div>').css('bottom', '-6px').css('right', '-6px');
      this.$corner4 = $('<div class="wcFrameCornerNE wcFrameEdge"></div>').css('bottom', '-6px').css('left', '-6px');

      this.$frame.append(this.$top);
      this.$frame.append(this.$bottom);
      this.$frame.append(this.$left);
      this.$frame.append(this.$right);
      this.$frame.append(this.$corner1);
      this.$frame.append(this.$corner2);
      this.$frame.append(this.$corner3);
      this.$frame.append(this.$corner4);
    }

    this.$frame.append(this.$center);

    // Floating windows have no container.
    this.__container(this.$container);

    if (this._isFloating) {
      this.$frame.addClass('wcFloating');
    }

    this.$center.scroll(this.__scrolled.bind(this));
  },

  // Updates the size of the frame.
  __update: function() {
    var width = this.$container.width();
    var height = this.$container.height();

    // Floating windows manage their own sizing.
    if (this._isFloating) {
      var left = (this._pos.x * width) - this._size.x/2;
      var top = (this._pos.y * height) - this._size.y/2;

      if (top < 0) {
        top = 0;
      }

      if (left + this._size.x/2 < 0) {
        left = -this._size.x/2;
      }

      if (left + this._size.x/2 > width) {
        left = width - this._size.x/2;
      }

      if (top + parseInt(this.$center.css('top')) > height) {
        top = height - parseInt(this.$center.css('top'));
      }

      this.$frame.css('left', left + 'px');
      this.$frame.css('top', top + 'px');
      this.$frame.css('width', this._size.x + 'px');
      this.$frame.css('height', this._size.y + 'px');
    }

    this.__updateTabs();
  },

  // Saves the current panel configuration into a meta
  // object that can be used later to restore it.
  __save: function() {
    var data = {};
    data.type = 'wcFrame';
    data.floating = this._isFloating;
    data.pos = {
      x: this._pos.x,
      y: this._pos.y,
    };
    data.size = {
      x: this._size.x,
      y: this._size.y,
    };
    data.tab = this._curTab;
    data.panels = [];
    if (!data.center) {
      for (var i = 0; i < this._panelList.length; ++i) {
        data.panels.push(this._panelList[i].__save());
      }
    }
    return data;
  },

  // Restores a previously saved configuration.
  __restore: function(data, docker) {
    this._isFloating = data.floating;
    this._pos.x = data.pos.x;
    this._pos.y = data.pos.y;
    this._size.x = data.size.x;
    this._size.y = data.size.y;
    this._curTab = data.tab;
    for (var i = 0; i < data.panels.length; ++i) {
      var panel = docker.__create(data.panels[i], this, this.$center);
      panel.__restore(data.panels[i], docker);
      this._panelList.push(panel);
    }

    this.__update();
  },

  __updateTabs: function() {
    this.$title.empty();

    // Move all tabbed panels to a temporary element to preserve event handlers on them.
    var $tempCenter = $('<div>');
    this.$frame.append($tempCenter);
    this.$center.children().appendTo($tempCenter);

    var self = this;
    for (var i = 0; i < this._panelList.length; ++i) {
      var $tab = $('<div id="' + i + '" class="wcPanelTab">' + this._panelList[i].title() + '</div>');
      this.$title.append($tab);

      var $tabContent = $('<div class="wcPanelTabContent wcPanelBackground" id="' + i + '">');
      this.$center.append($tabContent);
      this._panelList[i].__container($tabContent);
      this._panelList[i]._parent = this;

      if (this._curTab !== i) {
        $tabContent.addClass('wcPanelTabContentHidden');
      } else {
        $tab.addClass('wcPanelTabActive');
      }
    }

    $tempCenter.remove();
    this.__onTabChange();
  },

  __onTabChange: function() {
    var panel = this.panel();
    if (panel) {
      var scrollable = panel.scrollable();
      this.$center.toggleClass('wcScrollableX', scrollable.x);
      this.$center.toggleClass('wcScrollableY', scrollable.y);

      var overflowVisible = panel.overflowVisible();
      this.$center.toggleClass('wcOverflowVisible', overflowVisible);

      if (panel.moveable() && panel.title()) {
        this.$frame.prepend(this.$title);
        this.$center.css('top', '');
      } else {
        this.$title.remove();
        this.$center.css('top', '0px');
      }

      while (this._buttonList.length) {
        this._buttonList.pop().remove();
      }

      if (panel.closeable()) {
        this.$title.append(this.$close);
      } else {
        this.$close.remove();
      }

      for (var i = 0; i < panel._buttonList.length; ++i) {
        var buttonData = panel._buttonList[i];
        var $button = $('<div>');
        $button.addClass('wcFrameButton');
        if (buttonData.isTogglable) {
          $button.addClass('wcFrameButtonToggler');

          if (buttonData.isToggled) {
            $button.addClass('wcFrameButtonToggled');
          }
        }
        if (buttonData.className) {
          $button.addClass(buttonData.className);
        }
        $button.attr('title', buttonData.tip);
        $button.data('name', buttonData.name);
        $button.text(buttonData.text);

        this._buttonList.push($button);
        this.$title.append($button);
      }

      panel.__update();

      this.$center.scrollLeft(panel._scroll.x);
      this.$center.scrollTop(panel._scroll.y);
    }
  },

  // Handles scroll notifications.
  __scrolled: function() {
    var panel = this.panel();
    panel._scroll.x = this.$center.scrollLeft();
    panel._scroll.y = this.$center.scrollTop();

    panel.__trigger(wcDocker.EVENT_SCROLLED);
  },

  // Brings the frame into focus.
  // Params:
  //    flash     Optional, if true will flash the window.
  __focus: function(flash) {
    if (flash) {
      var $flasher = $('<div class="wcFrameFlasher">');
      this.$frame.append($flasher);
      $flasher.animate({
        opacity: 0.25,
      },100)
      .animate({
        opacity: 0.0,
      },100)
      .animate({
        opacity: 0.1,
      },50)
      .animate({
        opacity: 0.0,
      },50)
      .queue(function(next) {
        $flasher.remove();
        next();
      });
    }
  },

  // Moves the panel based on mouse dragging.
  // Params:
  //    mouse     The current mouse position.
  __move: function(mouse) {
    var width = this.$container.width();
    var height = this.$container.height();

    this._pos.x = (mouse.x + this._anchorMouse.x) / width;
    this._pos.y = (mouse.y + this._anchorMouse.y) / height;
  },

  // Sets the anchor position for moving the panel.
  // Params:
  //    mouse     The current mouse position.
  __anchorMove: function(mouse) {
    var width = this.$container.width();
    var height = this.$container.height();

    this._anchorMouse.x = (this._pos.x * width) - mouse.x;
    this._anchorMouse.y = (this._pos.y * height) - mouse.y;
  },

  // Moves a tab from a given index to another index.
  // Params:
  //    fromIndex     The current tab index to move.
  //    toIndex       The new index to move to.
  // Returns:
  //    element       The new element of the moved tab.
  //    false         If an error occurred.
  __tabMove: function(fromIndex, toIndex) {
    if (fromIndex >= 0 && fromIndex < this._panelList.length &&
        toIndex >= 0 && toIndex < this._panelList.length) {
      var panel = this._panelList.splice(fromIndex, 1);
      this._panelList.splice(toIndex, 0, panel[0]);

      // Preserve the currently active tab.
      if (this._curTab === fromIndex) {
        this._curTab = toIndex;
      }

      this.__updateTabs();

      return this.$title.find('.wcPanelTab[id="' + toIndex + '"]')[0];
    }
    return false;
  },

  // Checks if the mouse is in a valid anchor position for docking a panel.
  // Params:
  //    mouse     The current mouse position.
  //    same      Whether the moving frame and this one are the same.
  __checkAnchorDrop: function(mouse, same, ghost, canSplit) {
    var panel = this.panel();
    if (panel && panel.moveable()) {
      return panel.layout().__checkAnchorDrop(mouse, same, ghost, (!this._isFloating && canSplit), this.$frame, panel.moveable() && panel.title());
    }
    return false;
  },

  // Resizes the panel based on mouse dragging.
  // Params:
  //    edges     A list of edges being moved.
  //    mouse     The current mouse position.
  __resize: function(edges, mouse) {
    var width = this.$container.width();
    var height = this.$container.height();
    var offset = this.$container.offset();

    mouse.x -= offset.left;
    mouse.y -= offset.top;

    var minSize = this.minSize();
    var maxSize = this.maxSize();

    var pos = {
      x: (this._pos.x * width) - this._size.x/2,
      y: (this._pos.y * height) - this._size.y/2,
    };

    for (var i = 0; i < edges.length; ++i) {
      switch (edges[i]) {
        case 'top':
          this._size.y += pos.y - mouse.y-2;
          pos.y = mouse.y+2;
          if (this._size.y < minSize.y) {
            pos.y += this._size.y - minSize.y;
            this._size.y = minSize.y;
          }
          if (this._size.y > maxSize.y) {
            pos.y += this._size.y - maxSize.y;
            this._size.y = maxSize.y;
          }
          break;
        case 'bottom':
          this._size.y = mouse.y-4 - pos.y;
          if (this._size.y < minSize.y) {
            this._size.y = minSize.y;
          }
          if (this._size.y > maxSize.y) {
            this._size.y = maxSize.y;
          }
          break;
        case 'left':
          this._size.x += pos.x - mouse.x-2;
          pos.x = mouse.x+2;
          if (this._size.x < minSize.x) {
            pos.x += this._size.x - minSize.x;
            this._size.x = minSize.x;
          }
          if (this._size.x > maxSize.x) {
            pos.x += this._size.x - maxSize.x;
            this._size.x = maxSize.x;
          }
          break;
        case 'right':
          this._size.x = mouse.x-4 - pos.x;
          if (this._size.x < minSize.x) {
            this._size.x = minSize.x;
          }
          if (this._size.x > maxSize.x) {
            this._size.x = maxSize.x;
          }
          break;
      }

      this._pos.x = (pos.x + this._size.x/2) / width;
      this._pos.y = (pos.y + this._size.y/2) / height;
    }
  },

  // Turn off or on a shadowing effect to signify this widget is being moved.
  // Params:
  //    enabled       Whether to enable __shadow mode.
  __shadow: function(enabled) {
    if (enabled) {
      if (!this.$shadower) {
        this.$shadower = $('<div class="wcFrameShadower">');
        this.$frame.append(this.$shadower);
        this.$shadower.animate({
          opacity: 0.5,
        }, 300);
      }
    } else {
      if (this.$shadower) {
        var self = this;
        this.$shadower.animate({
          opacity: 0.0,
        }, 300)
        .queue(function(next) {
          self.$shadower.remove();
          self.$shadower = null;
          next();
        });
      }
    }
  },

  // Retrieves the bounding rect for this frame.
  __rect: function() {
    var offset = this.$frame.offset();
    var width = this.$frame.width();
    var height = this.$frame.height();

    return {
      x: offset.left,
      y: offset.top,
      w: width,
      h: height,
    };
  },

  // Gets, or Sets a new container for this layout.
  // Params:
  //    $container          If supplied, sets a new container for this layout.
  //    parent              If supplied, sets a new parent for this layout.
  // Returns:
  //    JQuery collection   The current container.
  __container: function($container) {
    if (typeof $container === 'undefined') {
      return this.$container;
    }

    this.$container = $container;
    if (this.$container) {
      this.$container.append(this.$frame);
    } else {
      this.$frame.remove();
    }
    return this.$container;
  },

  // Disconnects and prepares this widget for destruction.
  __destroy: function() {
    this._curTab = -1;
    for (var i = 0; i < this._panelList.length; ++i) {
      this._panelList[i].__destroy();
    }

    while (this._panelList.length) this._panelList.pop();
    this.__container(null);
    this._parent = null;
  },
};