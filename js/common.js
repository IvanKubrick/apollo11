(function(){
    $(document).ready(function() {
        $('#menu').on('click', 'a', function(e) {
            e.preventDefault();
            let id = $(this).attr('href'),
                padding = $('nav').height(),
                top = $(id).offset().top;
            $('body,html').animate({scrollTop: top - padding}, 1200);
        });

        $('#header-btn').on('click', function(e){
            e.preventDefault();

            let top = $("#booking").offset().top,
                padding = $('nav').height();
            $('body,html').animate({scrollTop: top - padding}, 1500);
        });

        $('#logo').on('click', function(e){
            e.preventDefault();
            $('body,html').animate({scrollTop: 0}, 1500);
        });
    });
})();

(function(){
    if (window.screen.availWidth < 769) {
        $(".wow").removeAttr('data-wow-offset').removeAttr('data-wow-delay');
    }  
})();
