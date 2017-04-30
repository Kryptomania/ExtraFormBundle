
(function( $ )
{
	
	var methods = {
		init : function( options ) { 
			// Create some defaults, extending them with any options that were provided
 
			return this.each(function()
			{
				var $this = $(this),
					data                 = $this.data('sfEmbedForms'),
					addItemLink          = $this.find(' .button-add-item[data-field='+ $this.attr('id') + ']'),
					collectionList       = $this.find(' .collection-list[data-field='+ $this.attr('id') + ']'),
					availableNumber      = collectionList.children().length;
				
				
				
				
				// If the plugin hasn't been initialized yet
				if ( ! data ) 
				{
					/*
					 Do more setup stuff here
					*/
					htmAttributes = new Object();
					if ($this.attr('data-prototype-name'))
					{
						htmAttributes['prototypeName'] = $this.attr('data-prototype-name');
					}

					settings = $.extend( {}, $.fn.sfEmbedForms.defaults, htmAttributes, options );
					$(this).data('sfEmbedForms', 
					{
						dataPrototype          : $this.attr('data-prototype'),
						collectionList         : collectionList,
						settings               : settings,
						availableNumber        : availableNumber,
					});
					  
					
					var collectionHolder	= $(this);
					
					$.each(collectionList.children(), function(){
						collectionHolder.sfEmbedForms('setRowActions', $(this));
					});

					//console.log(addItemLink);
					addItemLink.click(function(){
						collectionHolder.sfEmbedForms('addNewItem');
					});
					
					$this.on("embedForm.onAddNewItem", function (e, newForm){
						if ($this.data('sfEmbedForms').settings.onAddNewItem){
							$this.data('sfEmbedForms').settings.onAddNewItem.call($this, $(newForm));
						}
					});

				} // fin if (!data)
			});

		},// fin init function

		
		addNewItem : function() {
			return this.each(function(){
				var $this = $(this),
					data = $this.data('sfEmbedForms');

				var prototypeName = data.settings.prototypeName;
				var re            = new RegExp(prototypeName, 'g');
				var newForm       = data.dataPrototype.replace(re, data.availableNumber);
				//var newForm     = data.dataPrototype.replace(/__name__/g, data.availableNumber);
				data.availableNumber ++;
				
				//console.log(newForm);
				newForm = $(newForm);

				data.collectionList.append(newForm);
				//console.log('after');
				
				// actions after adding newForm
				// var newForm = data.collectionList.children(':last-child');
				designFormFields(newForm);
				$this.sfEmbedForms('setRowActions', newForm);
				
				//console.log ("========= in Plugin ==============");
				//console.log (this);
				//console.log (newForm);
				//console.log ("========= out of Plugin ==============");
				
				$this.trigger('embedForm.onAddNewItem', newForm);
			});

		}, // fin addNewItem


		destroy : function( ) {
			return this.each(function(){
				var $this = $(this);
				$this.removeData('sfEmbedForms');
			})
		}, // fin destroy
		
		setRowActions : function(form_row) { 
			var $this = $(this),
				data = $this.data('sfEmbedForms');
				
			form_row.find('.remove-form-row').click(function(){
				$this.trigger('embedForm.beforeRemoveItem', $(this).closest('.sub-form-row'));
				$(this).closest('.sub-form-row').remove();
				$this.trigger('embedForm.afterRemoveItem');
			});
		}, // fin setRowActions
	};


	$.fn.sfEmbedForms = function( method ) 
	{
		// Method calling logic
		if ( methods[method] ) 
		{
			return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		}
		else if ( typeof method === 'object' || ! method ) 
		{
			return methods.init.apply( this, arguments );
		}
		else 
		{
			$.error( 'Method ' +  method + ' does not exist on jQuery.tooltip' );
		}
	};
		
	$.fn.sfEmbedForms.defaults = 
	{
		prototypeName : '__name__',
		onAddNewItem  : null,
	};
})( jQuery );