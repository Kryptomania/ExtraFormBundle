


(function( $ )
{
	
	var methods = {
		init : function( options ) { 
			// Create some defaults, extending them with any options that were provided
			settings = $.extend( {}, $.fn.masterInput.defaults, options );

			return this.each(function()
			{
				var $this = $(this),
					data  = $this.data('masterInput');
				
				// If the plugin hasn't been initialized yet
				if ( ! data ) 
				{
					/*
					 Do more setup stuff here
					*/

					if (settings.closest && settings.show ){
						settings.closest = settings.otherInput.closest(settings.closest);
					}

					$this.data('masterInput', 
					{
						settings               : settings,
						slaveInput             : $(settings.slave),
					});

					if (true == settings.refresh){
						$this.on({
							change: function(){
								$this.masterInput('refreshSlave');
							}
						});
						
					}
					if (true == settings.show){
						$this.on({
							change: function(){
								$this.masterInput('toogleSlave');
							}
						});
					}
					
					if (settings.triggerRefresh || settings.triggerShow)
					{
						$this.trigger('change');
					}

				} // fin if (!data)
			});

		},// fin init function


		refreshSlave: function (){
			return this.each(function(){
				var $this    = $(this),
					data     = $this.data('masterInput'),
					ajaxData = new Object(),
					slave = data.slaveInput
				;

				//console.log($this);
				//console.log('data.settings.otherChoice : ' + data.settings.otherChoice);
				//console.log('$this.val() :' + $this.val());
				if ($this.val() != '' && $this.val() != null  && $this.val() != data.settings.otherChoice)
				{
					
					ajaxData[data.settings.valueName] = $this.val();

					$.each(data.settings.requestParams, function(key, val){
						ajaxData[key] = val;
					});
					
					if (data.settings.postSlaveDataName){
						ajaxData[data.settings.postSlaveDataName] = slave.val();
					}
					
					$this.trigger('masterInput.beforeRefresh', ajaxData);

					$.ajax({
						url:       data.settings.url,
						data:      ajaxData,
						method:    data.settings.method,
						//type:      data.settings.responseType,
						success:   function(response, status, xhr){
							var ct = xhr.getResponseHeader("content-type") || "";
							if(response)
							{
								slave.empty();

								if (ct.indexOf('html') > -1) 
								{
									slave.html(response);
									if ($.fn.selectpicker)
									{
										slave.selectpicker("refresh").change();
									}
								}
								else if (ct.indexOf('json') > -1)
								{
									$.each(response, function(key, val) {
										var option = $('<option></option>');
										if (typeof val == 'object' && val !== null)
										{
											option.attr(val);
											option.text(val['text']);
										}
										else
										{
											option.attr('value', key);
											option.text(val);
										}
										slave.append(option);
									});
									if ($.fn.selectpicker)
									{
										slave.selectpicker("refresh").change();
									}
								}

								//console.log($(settings.slave).val());
								$this.trigger('masterInput.afterRefresh', ajaxData, slave);
							}
							else
							{
								$this.trigger('masterInput.errorUnexpectedData');
							}
						},
						error: function(e){
							$this.trigger('masterInput.errorLoadingData', e);
							alert( "Erreur lors de la récupération" );
						}
					});
				}
				else{
					slave.children().each(function(i, child){
						if($(child).attr('value') == '' || $(child).attr('value') == data.settings.otherChoice){
							
						}
						else{
							$(child).remove();
						}
					});
					if ($.fn.selectpicker)
					{
						slave.selectpicker("refresh").change();
					}
				}
			});
		},


		toogleSlave: function (){
			return this.each(function(){
				var $this    = $(this),
					data     = $this.data('masterInput'),
					settings = data.settings
				;

				//console.log('data.settings.otherChoice: ' + data.settings.otherChoice );
				//console.log('$this.val(): ' + $this.val() );
				if (data.settings.otherChoice == $this.val()){
					if (settings.closest)
					{
						settings.closest.fadeIn(300, function(){
							$this.trigger('masterInput.show', settings.otherInput, settings.closest);
						});
					}
					else{
						settings.otherInput.val('')
							.removeAttr('readonly')
							.removeClass('disabled')
							//.off('focus', removeFocus)
						;
						$this.trigger('masterInput.show', settings.otherInput, settings.closest);
					}
				}
				else{
					if (settings.closest)
					{
						settings.closest.fadeOut(300, function (){
							$this.trigger('masterInput.hide', settings.otherInput, settings.closest);
						});
						settings.otherInput.val('');
					}
					else{
						settings.otherInput.val('')
							.attr('readonly', 'readonly')
							.addClass('disabled')
							.on('focus', removeFocus)
						;
						$this.trigger('masterInput.hide', settings.otherInput, settings.closest);
					}
				}

			});
		},


		destroy : function( ) {
			return this.each(function(){
				var $this = $(this);
				$this.removeData('masterInput');
			}) 
		}, // fin destroy

	};

	function removeFocus(e){
		console.log(e);
	}

	$.fn.masterInput = function( method ) 
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
			$.error('Method ' +  method + ' does not exist on jQuery.masterInput');
		}
	};
		
	$.fn.masterInput.defaults = 
	{
		method               : 'POST',
		responseType         : 'html',
		requestParams        : [],
		valueName            : 'id', 
		refresh              : false,
		show                 : false,
		//closest            : null,
		//url                : null,
		//slave              : null,
		//otherChoice        : 'other',
		//otherInput         : null,
		postSlaveDataName    : false,
		triggerShow          : false,
		triggerRefresh       : false,
		
	};
	
})( jQuery );