(function($) {
	'use strict';

	// Sticky Navbar
    $(window).on('scroll', function() {
        var $navbar = $('.navbar'),
            $mbNav = $('.mb-nav');

        $navbar.toggleClass("sticky", $(this).scrollTop() > 100);
        $mbNav.toggleClass("sticky", $(this).scrollTop() > 50);
    });

	// Responsive Menu
    $(document).on('click', '.responsive-menu-list', function(e) {
        e.stopPropagation();
        var $this = $(this);
        $('.responsive-menu-list').removeClass('active');
        $this.toggleClass('active', !$this.hasClass('active'));
    });

	// Hover Button
    $(document).on('mouseenter mouseout', '.main-btn', function(e) {
        var parentOffset = $(this).offset(),
            relX = e.pageX - parentOffset.left,
            relY = e.pageY - parentOffset.top;
        $(this).find('span').css({top: relY, left: relX});
    });

	// Odometer JS
	$('.odometer').appear(function() {
		$(".odometer").each(function() {
			$(this).html($(this).attr("data-count"));
		});
	});

	// Team Slides
	$('.image-courser').owlCarousel({
		nav: true,
		loop: true,
		dots: false,
		margin: 30,
		autoplay: true,
		autoplayTimeout: 2000,
		autoplayHoverPause: true,
		navText: [
			"<i class='fi fi-tr-angle-small-left'></i>",
			"<i class='fi fi-tr-angle-small-right'></i>"
		],
		responsive: {
			0: {
				items: 1
			},
			576: {
				items: 2
			},
			768: {
				items: 2
			},
			992: {
				items: 3
			},
			1200: {
				items: 3
			}
		}
	});

	// Gallery Filtering
    $(document).on('click', '.item-list', function() {
        var value = $(this).attr('data-filter');
        if (value === 'all') {
            $('.item-box').show('1000');
        } else {
            $('.item-box').hide('1000').filter('.' + value).show('1000');
        }
    });
	
    // Play Button
    $(document).on('click', '.play', function() {
        $(this).addClass('on').siblings().removeClass('on');
    });

	// Testimonial Slides
	$('.testimonial-content').owlCarousel({
		nav: true,
		loop: true,
		dots: false,
		margin: 30,
		autoplay: true,
		autoplayTimeout: 2000,
		autoplayHoverPause: true,
		navText: [
			"<i class='fi fi-tr-arrow-left'></i>",
			"<i class='fi fi-tr-arrow-right'></i>"
		],
		responsive: {
			0: {
				items: 1
			},
			576: {
				items: 1
			},
			768: {
				items: 1
			},
			992: {
				items: 1
			},
			1200: {
				items: 1
			}
		}
	});

	// Article Slider
	$('.article-content').owlCarousel({
		dots: true,
		nav: false,
		loop: true,
		margin: 30,
		autoplay: true,
		autoplayTimeout: 2000,
		autoplayHoverPause: false,
		responsive: {
			0: {
				items: 1
			},
			576: {
				items: 1
			},
			768: {
				items: 2
			},
			992: {
				items: 1
			},
			1200: {
				items: 2
			}
		}
	});
	
	// Instagram slider
	$('.ins-gallery').owlCarousel({
		nav: false,
		dots: false,
		loop: true,
		autoplay: true,
		autoplayTimeout: 1900,
		autoplayHoverPause: true,
		responsive: {
			0: {
				items: 3
			},
			576: {
				items: 2
			},
			768: {
				items: 5
			},
			992: {
				items: 6
			},
			1200: {
				items: 10
			}
		}
	});
	
	// AOS Animation
	AOS.init();

	// Back to Top Button
	let calcScrollValue = () => {
		let scrollProgress = document.getElementById("progress");
		let progressValue = document.getElementById("progress-value");
		let pos = document.documentElement.scrollTop;
		let calcHeight =
		  document.documentElement.scrollHeight -
		  document.documentElement.clientHeight;
		let scrollValue = Math.round((pos * 100) / calcHeight);
		if (pos > 100) {
		  	scrollProgress.style.display = "grid";
		} else {
		  	scrollProgress.style.display = "none";
		}
		scrollProgress.addEventListener("click", () => {
		  	document.documentElement.scrollTop = 0;
		});
		scrollProgress.style.background = `conic-gradient(#7f00ff ${scrollValue}%, #9094a6 ${scrollValue}%)`;
	  };
	  
	  window.onscroll = calcScrollValue;
	  window.onload = calcScrollValue;
		
})(jQuery);