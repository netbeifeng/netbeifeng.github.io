/**
 * Sets up Justified Gallery.
 */
if (!!$.prototype.justifiedGallery) {
  var options = {
    rowHeight: 180,
    margins: 4,
    lastRow: "justify"
  };
  $(".article-gallery").justifiedGallery(options);
}

function removeCss(href) {
  var links = document.getElementsByTagName("link");
  for (var i = 0; i < links.length; i++) {
      var _href = links[i].href;
      if (links[i] && links[i].href && links[i].href.indexOf(href) != -1) {
          links[i].parentNode.removeChild(links[i]);
      }
  }
}

function loadCss(href) {
  var addSign = true;
  var links = document.getElementsByTagName("link");
  for (var i = 0; i < links.length; i++) {
      if (links[i] && links[i].href && links[i].href.indexOf(href) != -1) {
          addSign = false;
      }
  }
  if (addSign) {
      var $link = document.createElement("link");
      $link.setAttribute("rel", "stylesheet");
      
      $link.setAttribute("href", href);
      $link.setAttribute("type", "text/css");
      document.getElementsByTagName("head").item(0).appendChild($link);
  }
}

$(function(){
  /**\
   * Dark mode
   */
  if (localStorage.getItem("dark_mode") === 'dark'){
    $("#logo").attr("style","background-image:url(/imgs/header.png)");
    $("#dark-btn").attr("class","fa fa-sun");
  }
});

$(document).ready(function() {
  /**
   * Logo print
   */
  console.log('鈻堚枅鈺�  鈻堚枅鈺� 鈻堚枅鈻堚枅鈻堚晽 鈻堚枅鈻堚枅鈻堚枅鈺� 鈻堚枅鈻堚枅鈻堚枅鈻堚晽鈻堚枅鈻堚枅鈻堚枅鈻堚晽');
  console.log('鈻堚枅鈺�  鈻堚枅鈺戔枅鈻堚晹鈺愨晲鈻堚枅鈺椻枅鈻堚晹鈺愨晲鈻堚枅鈺椻枅鈻堚晹鈺愨晲鈺愨晲鈺濃枅鈻堚晹鈺愨晲鈺愨晲鈺�');
  console.log('鈻堚枅鈻堚枅鈻堚枅鈻堚晳鈻堚枅鈻堚枅鈻堚枅鈻堚晳鈻堚枅鈺�  鈻堚枅鈺戔枅鈻堚枅鈻堚枅鈺�  鈻堚枅鈻堚枅鈻堚枅鈻堚晽');
  console.log('鈻堚枅鈺斺晲鈺愨枅鈻堚晳鈻堚枅鈺斺晲鈺愨枅鈻堚晳鈻堚枅鈺�  鈻堚枅鈺戔枅鈻堚晹鈺愨晲鈺�  鈺氣晲鈺愨晲鈺愨枅鈻堚晳');
  console.log('鈻堚枅鈺�  鈻堚枅鈺戔枅鈻堚晳  鈻堚枅鈺戔枅鈻堚枅鈻堚枅鈻堚晹鈺濃枅鈻堚枅鈻堚枅鈻堚枅鈺椻枅鈻堚枅鈻堚枅鈻堚枅鈺�');
  console.log('鈺氣晲鈺�  鈺氣晲鈺濃暁鈺愨暆  鈺氣晲鈺濃暁鈺愨晲鈺愨晲鈺愨暆 鈺氣晲鈺愨晲鈺愨晲鈺愨暆鈺氣晲鈺愨晲鈺愨晲鈺愨暆');

  var now = new Date();
  if (now.getFullYear() == '2020' && now.getMonth() == '4' && now.getDate() == '4') {
    console.log('瀵瑰叏鍥藉悇鏃忎汉姘戝鎶楀嚮鏂板啝鑲虹値鐤儏鏂椾簤鐗虹壊鐑堝＋鍜岄€濅笘鍚岃優琛ㄧず娣卞垏鍝€鎮笺€�')
    $('html').attr('style', 'filter: grayscale(100%)');
  }

  /**
   * Switch mode
   */
  $("#dark-btn,#dark-mobile").click(function() {
    if (localStorage.getItem("dark_mode") === 'dark'){
      removeCss('/css/dark.css');
      $("#logo").attr("style","background-image:url(/imgs/header.png)");
      $("#dark-btn").attr("class","fa fa-moon");
      localStorage.setItem("dark_mode", 'light');
    } else {
      loadCss('/css/dark.css');
      $("#logo").attr("style","background-image:url(/imgs/header.png)");
      $("#dark-btn").attr("class","fa fa-sun");
      localStorage.setItem("dark_mode", 'dark');
    }
  });

  /**
   * light-gallery
   */
  $("#lightgallery").lightGallery();

  //$("#mygallery").justifiedGallery();

  /**
   * pangu
   */
  pangu.spacingPage();

  /**
   * Shows the responsive navigation menu on mobile.
   */
  $("#header > #nav > ul > .icon").click(function() {
    $("#header > #nav > ul").toggleClass("responsive");
  });


  /**
   * Controls the different versions of  the menu in blog post articles
   * for Desktop, tablet and mobile.
   */
  if ($(".post").length) {
    var menu = $("#menu");
    var nav = $("#menu > #nav");
    var menuIcon = $("#menu-icon, #menu-icon-tablet");

    /**
     * Display the menu on hi-res laptops and desktops.
     */
    if ($(document).width() >= 1440) {
      menu.css("visibility", "visible");
      menuIcon.addClass("active");
    }

    /**
     * Display the menu if the menu icon is clicked.
     */
    menuIcon.click(function() {
      if (menu.css("visibility") === "hidden") {
        menu.css("visibility", "visible");
        menuIcon.addClass("active");

      } else {
        menu.css("visibility", "hidden");
        menuIcon.removeClass("active");
      }
      return false;
    });

    if (!nav.is(":visible")) {
      nav.show();
    }

    /**
     * Add a scroll listener to the menu to hide/show the navigation links.
     */
    if (menu.length) {
      $(window).on("scroll", function() {
        var topDistance = menu.offset().top;

        // hide only the navigation links on desktop
        if (!nav.is(":visible") && topDistance < 50) {
          nav.show();
        } else if (nav.is(":visible") && topDistance > 100) {
          nav.hide();
        }

        // on tablet, hide the navigation icon as well and show a "scroll to top
        // icon" instead
        if ( ! $( "#menu-icon" ).is(":visible") && topDistance < 50 ) {
          $("#menu-icon-tablet").show();
          $("#top-icon-tablet").hide();
        } else if (! $( "#menu-icon" ).is(":visible") && topDistance > 100) {
          $("#menu-icon-tablet").hide();
          $("#top-icon-tablet").show();
        }
      });
    }

    /**
     * Show mobile navigation menu after scrolling upwards,
     * hide it again after scrolling downwards.
     */
    if ($( "#footer-post").length) {
      var lastScrollTop = 0;
      $(window).on("scroll", function() {
        var topDistance = $(window).scrollTop();

        if (topDistance > lastScrollTop){
          // downscroll -> show menu
          $("#footer-post").hide();
        } else {
          // upscroll -> hide menu
          $("#footer-post").show();
        }
        lastScrollTop = topDistance;

        // close all submenu"s on scroll
        $("#nav-footer").hide();
        $("#toc-footer").hide();
        $("#share-footer").hide();

        // show a "navigation" icon when close to the top of the page,
        // otherwise show a "scroll to the top" icon
        if (topDistance < 50) {
          $("#actions-footer > #top").hide();
        } else if (topDistance > 100) {
          $("#actions-footer > #top").show();
        }
      });
    }
  }
});
