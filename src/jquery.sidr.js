/*
 * Sidr
 * https://github.com/artberri/sidr
 *
 * Copyright (c) 2013 Alberto Varela
 * Licensed under the MIT license.
 */

;(function( $ ){

  var sidrMoving = false,
      sidrOpened = false;

  // Private methods
  var privateMethods = {
    // Check for valids urls
    // From : http://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-an-url
    isUrl: function (str) {
      var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
        '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
      if(!pattern.test(str)) {
        return false;
      } else {
        return true;
      }
    },
    // Loads the content into the menu bar
    loadContent: function($menu, content) {
      $menu.html(content);
    },
    // Add sidr prefixes
    addPrefix: function($element) {
      var elementId = $element.attr('id'),
          elementClass = $element.attr('class');

      if(typeof elementId === 'string' && '' !== elementId) {
        $element.attr('id', elementId.replace(/([A-Za-z0-9_.\-]+)/g, 'sidr-id-$1'));
      }
      if(typeof elementClass === 'string' && '' !== elementClass && 'sidr-inner' !== elementClass) {
        $element.attr('class', elementClass.replace(/([A-Za-z0-9_.\-]+)/g, 'sidr-class-$1'));
      }
      $element.removeAttr('style');
    },
    // Check if transitions is supported
    transitions: (function() {
      var body = document.body || document.documentElement,
          style = body.style,
          supported = false,
          property = 'transition';
      if (property in style) {
        supported = true;
      }
      else {
        var prefixes = ['moz', 'webkit', 'o', 'ms'],
            prefix;
        property = property.charAt(0).toUpperCase() + property.substr(1);
        supported = (function() {
          for (var i = 0; i < prefixes.length; i++) {
            prefix = prefixes[i];
            if((prefix + property) in style) {
              return true;
            }
          }
          return false;
        })();
        property = supported ? '-' + prefix.toLowerCase() + '-' + property.toLowerCase() : null;
      }
      return {
        supported: supported,
        property: property
      };
    })(),
    execute: function(action, name, callback) {
      // Check arguments
      if(typeof name === 'function') {
        callback = name;
        name = 'sidr';
      }
      else if(!name) {
        name = 'sidr';
      }

      // Declaring
      var $menu = $('#' + name),
          $body = $($menu.data('body')),
          $html = $('html'),
          menuWidth = $menu.data('width'),
          speed = $menu.data('speed'),
          side = $menu.data('side'),
          displace = $menu.data('displace'),
          onOpen = $menu.data('onOpen'),
          onClose = $menu.data('onClose'),
          bodyAnimation,
          menuAnimation,
          scrollTop,
          transitions = privateMethods.transitions,
          completed,
          bodyClass = (name === 'sidr' ? 'sidr-open' : 'sidr-open ' + name + '-open');

      // Open Sidr
      if('open' === action || ('toggle' === action && !$menu.hasClass('open'))) {
        // Check if we can open it
        if( $menu.hasClass('open') || sidrMoving ) {
          return;
        }

        // If another menu opened close first
        if(sidrOpened !== false) {
          methods.close(sidrOpened, function() {
            methods.open(name);
          });

          return;
        }

        // Lock sidr
        sidrMoving = true;

        // Left or right?
        if(side === 'left') {
          bodyAnimation = {left: menuWidth};
          menuAnimation = {left: '0px'};
        }
        else {
          bodyAnimation = {right: menuWidth};
          menuAnimation = {right: '0px'};
        }

        // Prepare page if container is body
        if($body.is('body')){
          scrollTop = $html.scrollTop();
          $html.css('overflow-x', 'hidden').scrollTop(scrollTop);
        }

        // Open menu
        if(displace){
          $body.addClass('sidr-animating').css({
            width: $body.width(),
            position: 'absolute'
          });
        }

        // Animation done
        completed = function() {
          sidrMoving = false;
          sidrOpened = name;
          // Callback
          if(typeof callback === 'function') {
            callback(name);
          }
          $body.removeClass('sidr-animating');
        };

        // Prepare opening
        $body.addClass(bodyClass);
        $menu.addClass('open').css('width', '100%').css('max-width', menuWidth);

        // onOpen callback
        onOpen();
      }
      // Close Sidr
      else {
        // Check if we can close it
        if( !$menu.hasClass('open') || sidrMoving ) {
          return;
        }

        // Lock sidr
        sidrMoving = true;

        // Right or left menu?
        if(side === 'left') {
          bodyAnimation = {left: 0};
          menuAnimation = {left: '-' + menuWidth};
        }
        else {
          bodyAnimation = {right: 0};
          menuAnimation = {right: '-' + menuWidth};
        }

        // Close menu
        completed = function() {
          $menu.removeClass('open').removeAttr('style').width(0).css(side, '-' + menuWidth);
          $body.removeClass(bodyClass).removeAttr('style');
          $menu.removeAttr('style');
          $body.removeAttr('style');
          $('html').removeAttr('style');
          sidrMoving = false;
          sidrOpened = false;
          // Callback
          if(typeof callback === 'function') {
            callback(name);
          }
          $body.removeClass('sidr-animating');
        };

        // prepare
        if($body.is('body')){
          scrollTop = $html.scrollTop();
          $html.removeAttr('style').scrollTop(scrollTop);
        }

        // onClose callback
        onClose();
      }

      // Open or close menu
      if (transitions.supported) {
        //$body.css(transitions.property, side + ' ' + (speed/1000) + 's ease');
        $menu.css(transitions.property, side + ' ' + (speed/1000) + 's ease').one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', completed);
        //$body.css(bodyAnimation);
        $menu.css(menuAnimation);
      }
      else {
        $body.animate(bodyAnimation, speed);
        $menu.animate(menuAnimation, speed, completed);
      }
    }
  };

  // Sidr public methods
  var methods = {
    open: function(name, callback) {
      privateMethods.execute('open', name, callback);
    },
    close: function(name, callback) {
      privateMethods.execute('close', name, callback);
    },
    toggle: function(name, callback) {
      privateMethods.execute('toggle', name, callback);
    },
    // I made a typo, so I mantain this method to keep backward compatibilty with 1.1.1v and previous
    toogle: function(name, callback) {
      privateMethods.execute('toggle', name, callback);
    }
  };

  $.sidr = function( method ) {

    if ( methods[method] ) {
      return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
    }
    else if ( typeof method === 'function' || typeof method === 'string' || ! method ) {
      return methods.toggle.apply( this, arguments );
    }
    else {
      $.error( 'Method ' + method + ' does not exist on jQuery.sidr' );
    }

  };

  $.fn.sidr = function( options ) {

    var settings = $.extend( {
      name          : 'sidr',         // Name for the 'sidr',
      width         : 260,            // Width for the 'Sidr' 
      speed         : 200,            // Accepts standard jQuery effects speeds (i.e. fast, normal or milliseconds)
      side          : 'left',         // Accepts 'left' or 'right'
      source        : null,           // Override the source of the content.
      renaming      : true,           // The ids and classes will be prepended with a prefix when loading existent content
      body          : 'body',         // Page container selector,
      displace: true, // Displace the body content or not
      onOpen        : function() {},  // Callback when sidr opened
      onClose       : function() {}   // Callback when sidr closed
    }, options);

    var name = settings.name,
        $sideMenu = $('#' + name),
        menuWidth = typeof settings.width === 'number' ? settings.width + 'px' : settings.width;;

    // If the side menu do not exist create it
    if( $sideMenu.length === 0 ) {
      $sideMenu = $('<div />')
        .attr('id', name)
        .appendTo($('body'));
    }

    // Adding styles and options
    $sideMenu
      .addClass('sidr')
      .addClass(settings.side)
      .data({
        speed          : settings.speed,
        side           : settings.side,
        body           : settings.body,
        width          : menuWidth,
        displace       : settings.displace,
        onOpen         : settings.onOpen,
        onClose        : settings.onClose
      });

    $sideMenu.width(0);  

    // The menu content
    if(typeof settings.source === 'function') {
      var newContent = settings.source(name);
      privateMethods.loadContent($sideMenu, newContent);
    }
    else if(typeof settings.source === 'string' && privateMethods.isUrl(settings.source)) {
      $.get(settings.source, function(data) {
        privateMethods.loadContent($sideMenu, data);
      });
    }
    else if(typeof settings.source === 'string') {
      var htmlContent = '',
          selectors = settings.source.split(',');

      $.each(selectors, function(index, element) {
        htmlContent += '<div class="sidr-inner">' + $(element).html() + '</div>';
      });

      // Renaming ids and classes
      if(settings.renaming) {
        var $htmlContent = $('<div />').html(htmlContent);
        $htmlContent.find('*').each(function(index, element) {
          var $element = $(element);
          privateMethods.addPrefix($element);
        });
        htmlContent = $htmlContent.html();
      }
      privateMethods.loadContent($sideMenu, htmlContent);
    }
    else if(settings.source !== null) {
      $.error('Invalid Sidr Source');
    }

    return this.each(function(){
      var $this = $(this),
          data = $this.data('sidr');

      // If the plugin hasn't been initialized yet
      if ( ! data ) {

        $this.data('sidr', name);
        if('ontouchstart' in document.documentElement) {
          $this.bind('touchstart', function(e) {
            var theEvent = e.originalEvent.touches[0];
            this.touched = e.timeStamp;
          });
          $this.bind('touchend', function(e) {
            var delta = Math.abs(e.timeStamp - this.touched);
            if(delta < 200) {
              e.preventDefault();
              methods.toggle(name);
            }
          });
        }
        else {
          $this.click(function(e) {
            e.preventDefault();
            methods.toggle(name);
          });
        }
      }
    });
  };

})( jQuery );
