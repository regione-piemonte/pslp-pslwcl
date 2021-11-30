/**
 * @file
 * Attaches behaviors for the Clientside Validation jQuery module.
 */
(function ($, Drupal) {
  /**
   * Attaches jQuery validate behavoir to forms.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *  Attaches the outline behavior to the right context.
   */
  Drupal.behaviors.cvJqueryValidate = {
    attach: function (context) {
      $(context).find('form').validate();
    }
  };
})(jQuery, Drupal);
;
(function ($) {
	
	$.urlParam = function(name){
		var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
		return (results) ? results[1] : null;
	}
	
	// Ricerca libera
	$('#edit-cerca').keydown(function (e) {
	    var keypressed = e.keyCode || e.which;
	    if (keypressed == 13) {
		    e.preventDefault();
	        $('#views-exposed-form-progetti-page-projects').submit();
	    }
	});
	
	// Filtri
	$('.filter-button-group').on( 'click', 'button', function(e) {
		// Reset filtro tipologia
		if ($(this).attr('data-filter').substring(1,13) == 'project-type' && $.urlParam('project-type') != null) {
			var param = $(this).attr('data-filter').substr(14,1);
			if (param == $.urlParam('project-type')) window.location = window.location.pathname;
			else window.location = window.location.pathname + '?project-type=' + param;
		}
		e.preventDefault();	
		$(this).toggleClass('active-filter');
		if(!$(this).parent().hasClass('filter-additive')){
			$(this).siblings().removeClass('active-filter');	
		}
		var filter = '';
		$('.filter-button-group .active-filter').each( function() {
			filter += $(this).attr('data-filter');	
		});
		$('.view-progetti .view-content .grid-item:not(' + filter + ')').hide('scale');
		if ($('.view-progetti .view-content .grid-item' + filter).length == 0) {
			$('.view-progetti .view-content').append('<div class="page-message error">Nessun progetto corrisponde ai filtri di ricerca</div>');
		} else $('.view-progetti .view-content .error').remove();
		$('.view-progetti .view-content .grid-item' + filter).show('scale');
		// Scroll
		$('html, body').animate({
        	scrollTop: $(".view-progetti .view-content").offset().top
    	}, 1000);
	});
	
	// Toggle blocco filtri
	$('.filtres-box .filtres-title').click( function(e){
		e.preventDefault();
		$(this).hide().siblings('h3').show();
		if ($(this).hasClass('filtres-open')) {
			$('.filtres-box .view-filtres').show('slow');
			// Scroll
			$('html, body').animate({
	        	scrollTop: $(".filtres-box").offset().top
	    	}, 1000);
		} else {
			$('.filtres-box .view-filtres').hide('slow');
		}
	});
	if ($.urlParam('project-type') != null) {
		var projectType = $.urlParam('project-type');
		$('.filter-button-group button[data-filter=".project-type-' + projectType + '"]').addClass('active-filter');
		$('.filtres-box .filtres-title.filtres-open').hide();
	} else {
		$('.filtres-box .filtres-title.filtres-close, .filtres-box .view-filtres').hide();
	}
	
	// Rimuovi anni non presenti nei progetti
	$('.filter-button-group-anni button').each(function(){
		var filter = $(this).attr('data-filter');	
		if ($(filter).length == 0) $(this).hide();
	});
	
	// Aggiungi link di reset form
	$('<a href="#" class="btn btn-outline-primary btn-lg m-2 hidden">').text(Drupal.t('Clear filters')).click(function(){
		$('#edit-cerca').val('');
		$('#views-exposed-form-progetti-page-projects').submit();
	}).appendTo('.view-filtres');
	
}(jQuery));;
