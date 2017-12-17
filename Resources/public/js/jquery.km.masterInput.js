


(function( $ )
{
    var showDebug = false;
    var methods = {
        init : function( options ) { 
            // Create some defaults, extending them with any options that were provided
            settings = $.extend( {}, $.fn.masterInput.defaults, options );
            if (settings.debug === true)
            {
                showDebug = true;
            }

            return this.each(function()
            {
                var $this = $(this),
                    data  = $this.data('masterInput');
                
                // If the plugin hasn't been initialized yet
                if ( ! data ) 
                {

                    var eventHandler = function(){
                        //console.log("call $this.masterInput('refresh')");
                        $this.masterInput('refresh');
                    };

                    $this.on({"change": eventHandler}); 

                    // store data
                    $this.data('masterInput', 
                    {
                        settings : settings,
                        eventHandler: eventHandler,
                        ajaxCounter: {
                            totalRequests: 0,
                            completedRequests: 0,
                        }
                    });


                    if (settings.triggerChangeOnStart === true)
                    {
                        $this.trigger('change');
                    }

                    

                } // fin if (!data)
            });

        },// fin init function
        
        


        refresh: function (context = false){
            return this.each(function(){
                debug("$(this).attr('name')", $(this).attr('name'), 'refresh');

                var $this     = $(this),
                    data      = $this.data('masterInput');

                if (!data)
                {
                    debug("data", data, 'refresh');
                    return true;
                }
                
                $this.trigger('masterInput.refreshInit', $this);
                var fields    = getFields(data, $this, context),
                    previousRequests = {};
                ;

                // Ajout de + 1 pour prendre en compte l'appel à la fin du forEach
                data.ajaxCounter.totalRequests = fields.length +1;
                data.ajaxCounter.completedRequests = 0;

                // les requêtes Ajax sont envoyées seulement s'il y a des valeurs selectionnées si acceptEmptyData == true
                // rafraichit les champs concernés
                fields.forEach(function(fieldParams, fieldIndex)
                {
                    debug("fieldParams", fieldParams, 'refresh');

                    if (fieldParams.refresh == true && fieldParams.ajaxUrl != null)
                    {
                        if ((((data.settings.acceptEmptyData == false && $this.val() != '' && $this.val() != null) || (data.settings.acceptEmptyData == true))  && fieldParams.showOnValues.includes($this.val()) == false) || (fieldParams.autoRefresh == true)  || (fieldParams.masterValueName == false))
                        {
                            // Données communes à toutes les requêtes
                            var ajaxData  = new Object();
                            var hasPreviousRequest = false;
                            
                            if (fieldParams.masterValueName)
                            {
                                ajaxData[fieldParams.masterValueName] = $this.val();
                            }

                            $.each(fieldParams.requestParams, function(key, val){
                                ajaxData[key] = val;
                            });

                            var ajaxUrl    = fieldParams.ajaxUrl;
                            var ajaxMethod = fieldParams.ajaxMethod;

                            if (fieldParams.sendSlaveDataName)
                            {
                                var dataSlaveName = fieldParams.sendSlaveDataName;
                                ajaxData[dataSlaveName] = fieldParams.item.val();
                            }

                            $this.trigger('masterInput.initAjax', ajaxData, ajaxUrl, fieldParams);

                            debug("fieldParams", fieldParams, "refresh");
                            debug("ajaxUrl", ajaxUrl, "refresh");
                            debug("ajaxData", ajaxData, "refresh");
                            debug("previousRequests", previousRequests, "refresh");
                            
                            var ajaxDataToString = JSON.stringify(ajaxData);

                            $.each(previousRequests, function(key, req){
                                if (ajaxUrl === req.url && ajaxDataToString === req.data)
                                {
                                    hasPreviousRequest = key;
                                    debug("hasPreviousRequest Found", hasPreviousRequest, "refresh");
                                    return false;
                                }
                            });

                            if (hasPreviousRequest !== false)
                            {
                                //debug("hasPreviousRequest", hasPreviousRequest, "refresh");
                                debug("previousRequests[hasPreviousRequest]['response']", previousRequests[hasPreviousRequest]['response'], "refresh");
                                
                                if (previousRequests[hasPreviousRequest]['response'] !== false){
                                    handleAjaxResponse(hasPreviousRequest.response, hasPreviousRequest.xhr, fieldParams, $this);
                                }
                                else
                                {
                                    previousRequests[hasPreviousRequest]['fields'].push(fieldParams);
                                }
                                isRefreshCompleted($this);
                            }
                            else
                            {
                                previousRequests[fieldIndex] = {
                                    'response': false,
                                    'url': ajaxUrl,
                                    'data': ajaxDataToString,
                                    'fields': [],
                                };

                                $.ajax({
                                    url:       ajaxUrl,
                                    data:      ajaxData,
                                    method:    ajaxMethod,
                                    success:   function(response, status, xhr){
                                        previousRequests[fieldIndex]['response'] = response;
                                        previousRequests[fieldIndex]['xhr'] = xhr;
                                        
                                        previousRequests[fieldIndex]['fields'].forEach(function(storedField){
                                            handleAjaxResponse(response, xhr, storedField, $this);
                                        });
                                        handleAjaxResponse(response, xhr, fieldParams, $this);
                                        isRefreshCompleted($this);
                                    },
                                    error: function(e){
                                        $this.trigger('masterInput.ajaxError', e, ajaxData, ajaxUrl, fieldParams);
                                        alert("Erreur lors de la récupération" );
                                    }
                                });
                            }
                        }
                        else
                        {
                            clearField(fieldParams);
                            if (fieldParams.disableIfEmpty == true)
                            {
                                fieldParams.item.attr('readonly', true) ;
                            }
                            $.fn.masterInput.refreshFieldTranformers(fieldParams); 
                            if (fieldParams.autoRefresh == false)
                            {
                                fieldParams.item.trigger('change');
                            }
                            
                            isRefreshCompleted($this);
                        }
                    }
                    else{
                        isRefreshCompleted($this);
                    }

                    // =====================================================
                    // ======= Affiche ou cache les champs concernés =======
                    // =====================================================

                    // Je détermine les champs qu'il faut cacher/afficher
                    if (fieldParams.show == true )
                    {
                        var parentToHide = fieldParams.parentToHide;
                        var showOnValues = fieldParams.showOnValues;
                        var isField = false;
                        
                        // détermine correctement le parent
                        if (parentToHide instanceof jQuery)
                        {
                            // rien à faire, c'est déjà un objet jquery
                        }
                        else if ((typeof parentToHide == 'string' || parentToHide instanceof String) && parentToHide.length > 0)
                        {
                            parentToHide = fieldParams.item.closest(parentToHide);
                        }
                        else {
                            // Par défaut, je prends l'élément lui-même
                            parentToHide = fieldParams.item;
                            isField = true;
                        }

                        debug("showOnValues", showOnValues, "refresh");
                        debug("$this.val()", $this.val(), "refresh");
                        
                        // Affiche ou cache
                        if (showOnValues.includes($this.val()) == true)
                        {
                            // active la saisie des champs Si readonly
                            if (fieldParams.putReadOnly == true)
                            {
                                if (isField)
                                {
                                    fieldParams.item.removeAttr('readonly').removeClass('disabled');
                                }
                                else
                                {
                                    parentToHide.find(':input, select, textarea').not(':button, :submit, :reset, :hidden').removeAttr('readonly').removeClass('disabled');
                                }
                            }

                            // active la saisie des champs Si readonly disabled
                            if (fieldParams.disablableField == true)
                            {
                                if (isField)
                                {
                                    fieldParams.item.removeAttr('disabled').removeClass('disabled');
                                }
                                else
                                {
                                    parentToHide.find(':input, select, textarea').not(':button, :submit, :reset, :hidden').removeAttr('disabled').removeClass('disabled');
                                }
                            }

                            if (fieldParams.hideItem == true)
                            {
                                parentToHide.fadeIn(300, function(){
                                    $this.trigger('masterInput.onShow', fieldParams, parentToHide);
                                    if (fieldParams.autoRefresh == false)
                                    {
                                        fieldParams.item.trigger('change');
                                    }
                                });
                            }
                            else
                            {
                                $this.trigger('masterInput.onShow', fieldParams, parentToHide);
                                if (fieldParams.autoRefresh == false)
                                {
                                    fieldParams.item.trigger('change');
                                }
                            }
                        }
                        else
                        {
                            debug('', 'Hide element', 'refresh');
                            // reinitialise les champs
                            if (fieldParams.clearOnHide == true)
                            {
                                debug('fieldParams.clearOnHide', 'true', 'refresh');
                                if (isField)
                                {
                                    fieldParams.item.val('');
                                    fieldParams.item.trigger('reset');
                                }
                                else
                                {
                                    if (fieldParams.clearSibling == true)
                                    {
                                        parentToHide.find(':input, select, textarea').not(':button, :submit, :reset, :hidden').val('').trigger('reset');
                                    }
                                    else
                                    {
                                        fieldParams.item.val('').trigger('reset');
                                    }
                                }
                            }

                            // désactive la saisie les champs avec un readonly
                            if (fieldParams.putReadOnly == true)
                            {
                                 debug('fieldParams.putReadOnly', 'true', 'refresh');
                                if (isField)
                                {
                                    fieldParams.item.attr('readonly', 'readonly').addClass('disabled');
                                }
                                else
                                {
                                    parentToHide.find(':input, select, textarea').not(':button, :submit, :reset, :hidden').attr('readonly', 'readonly').addClass('disabled');
                                }
                            }

                            // désactive le champ avec un disabled
                            if (fieldParams.disablableField == true)
                            {
                                if (isField)
                                {
                                    fieldParams.item.attr('disabled', 'disabled').addClass('disabled');
                                }
                                else
                                {
                                    parentToHide.find(':input, select, textarea').not(':button, :submit, :reset, :hidden').attr('disabled', 'disabled').addClass('disabled');
                                }
                            }

                            if (fieldParams.hideItem == true)
                            {
                                // lance un évènement après avoir caché
                                parentToHide.fadeOut(300, function (){
                                    $this.trigger('masterInput.onHide', fieldParams, parentToHide);
                                    if (fieldParams.autoRefresh == false)
                                    {
                                        fieldParams.item.trigger('change');
                                    }
                                });
                            }
                            else
                            {
                                $this.trigger('masterInput.onHide', fieldParams, parentToHide);
                                if (fieldParams.autoRefresh == false)
                                {
                                    fieldParams.item.trigger('change');
                                }
                            }
                        }
                    }
                });
                
                // Au cas où il n'y a pas de requetes Ajax, cette instruction permet de déclencher le refreshCompleted
                isRefreshCompleted($this);
            });
        },



        destroy : function( ) {
            return this.each(function(){
                var $this = $(this);
                $this.off("change", data('masterInput').eventHandler);
                $this.removeData('masterInput');
            }) 
        }, // fin destroy

    };
    
    function isRefreshCompleted(element){
        var data = element.data('masterInput');
        data.ajaxCounter.completedRequests++;

        if (data.ajaxCounter.completedRequests >= data.ajaxCounter.totalRequests){
            element.trigger('masterInput.refreshCompleted');
        }
    }

    function debug( objName, objValue, objFunction ) {
        if ( window.console && window.console.log && true === showDebug ) {
            window.console.log( "Function: " + objFunction + ", Content of var  " + objName + " :");
            window.console.log(objValue);
        }
    };

    function handleAjaxResponse(response, xhr, fieldParams, master){
        master.trigger('masterInput.ajaxSuccess', response, xhr, fieldParams);

        // remet le champ en mode écriture si nécessaire
        if (fieldParams.disableIfEmpty == true)
        {
            fieldParams.item.removeAttr('readonly', true) ;
        }

        refreshInput(response, xhr, fieldParams, master);
    }


    function getJqueryElement(data, ancestor, master)
    {
        // set ancestor
        if (typeof ancestor == 'string' || ancestor instanceof String)
        {
            ancestor = master.closest(ancestor);
            if (ancestor.length == 0)
            {
                ancestor = false;
            }
        }
        else if (ancestor instanceof jQuery){
            
        }
        else{
            ancestor = false;
        }
        
        debug('data', data, 'getJqueryElement');
        debug('ancestor', ancestor, 'getJqueryElement');

        // return jQuery Object or false
        if (data instanceof jQuery)
        {
            return data;
        }
        else if (typeof data == 'string' || data instanceof String)
        {
            if (ancestor){
                var elements = ancestor.find(data);
                return (elements.length == 0) ? false : elements ;
            }
            else{
                var elements = $(data);
                return (elements.length == 0) ? false : elements ;
            }
        }
        else if (typeof data == 'object')
        {
            // Complex data
            if (data.hasOwnProperty('item'))
            {
                if (data.hasOwnProperty('commonAncestor')){
                    ancestor = data.commonAncestor
                }
                return getJqueryElement(data.item, ancestor, master )
            }
        }
        else{
            return false;
        }
    }


    function getFields (data, master, context)
    {
        var inputs = data.settings.inputs;
        var commonAncestor = data.settings.commonAncestor;
        var fields = new Array();
        var popularConfig = {
            commonAncestor:      data.settings.commonAncestor,
            masterValueName:     data.settings.masterValueName,
            requestParams:       data.settings.requestParams,
            sendSlaveDataName:   data.settings.sendSlaveDataName,
            parentToHide:        data.settings.parentToHide,
            clearOnHide:         data.settings.clearOnHide,
            clearSibling:        data.settings.clearSibling,
            showOnValues:        data.settings.showOnValues,
            disablableField:     data.settings.disablableField,
            disableIfEmpty:      data.settings.disableIfEmpty,
            putReadOnly:         data.settings.putReadOnly,
            hideItem:            data.settings.hideItem,
            ajaxUrl:             data.settings.ajaxUrl,
            ajaxMethod:          data.settings.ajaxMethod,
            show:                data.settings.show,
            refresh:             data.settings.refresh,
            autoRefresh:         data.settings.autoRefresh,
            responseAsValue:     data.settings.responseAsValue,
        };


        if (Array.isArray(inputs))
        {
            inputs.forEach(function(inputSetting){
                if (typeof inputSetting == 'object')
                {
                    if (inputSetting.hasOwnProperty('item'))
                    {
                        var newCommonAncestor = inputSetting.hasOwnProperty('commonAncestor')?inputSetting.commonAncestor:commonAncestor;
                        // Only load fields in this context
                        if (context){
                            newCommonAncestor = context;
                        }
                        var inputNormalized = getJqueryElement(inputSetting.item, newCommonAncestor, master);
                        if (inputNormalized)
                        {
                            $.each(inputNormalized, function(i, element){
                                element = $(element);
                                fields.push($.extend({}, popularConfig, inputSetting, {'item': element}));
                            });
                        }
                    }
                    else if (inputSetting.hasOwnProperty('autoRefresh') && inputSetting.autoRefresh == true)
                    {
                        fields.push($.extend({}, popularConfig, inputSetting, {'item': master}));
                    }
                }
            });
        }

        debug("fields", fields, 'getFields');
        return fields;
    }


    function refreshInput(response, xhr, fieldParams, master)
    {
        // Comment vider le champ de façon sûre
        var field = fieldParams.item;
        var ct = xhr.getResponseHeader("content-type") || ""; 
        
        var oldValue = clearField(fieldParams);
        // On insère les données reçues (Json ou HTML)
        if (ct.indexOf('html') > -1) 
        {
            if (fieldParams.responseAsValue == true)
            {
                field.val(response);
            }
            else{
                field.html(response);
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
                field.append(option);
            });
        }

        
        if (fieldParams.item.is('select'))
        {
            if (typeof fieldParams.item.attr('data-other-choice-label') != 'undefined' && fieldParams.item.attr('data-other-choice-label') != false && typeof fieldParams.item.hasAttr('data-other-choice-value') != 'undefined' && fieldParams.item.hasAttr('data-other-choice-value') != false)
            {
                var option = $('<option></option>');

                option.attr(field.attr('data-other-choice-label'));
                option.text(field.attr('data-other-choice-value'));

                field.append(option);
            }
        }

        // remet l'ancienne valeur si possible
        if ((ct.indexOf('html') > -1) && fieldParams.responseAsValue)
        {
            // Dans ce cas, le champ a déjà une valeur
        }
        else{
            fieldParams.item.val(oldValue);
            debug('oldValue', oldValue, "refreshInput");
            debug('fieldParams.item.val()', fieldParams.item.val(), "refreshInput");
        }

        $.fn.masterInput.refreshFieldTranformers(fieldParams);
        if ((fieldParams.autoRefresh == false) && (oldValue != fieldParams.item.val()))
        {
            fieldParams.item.trigger('change');
        }

        master.trigger('masterInput.refreshed', response, xhr, fieldParams);
    }


    function clearField(fieldParams)
    {
        var oldValue = false;
        if (fieldParams.refresh == true)
        {
            if(fieldParams.item.val())
            {
                oldValue = fieldParams.item.val();
            }
            fieldParams.item.children().each(function(i, child){
                var optionValue = $(child).attr('value');
                if (( optionValue == '') || (optionValue == null) || (optionValue == false))
                {
                    
                }
                else if(fieldParams.showOnValues.includes(optionValue))
                {
                    
                }
                else{
                    $(child).remove();
                }
            });
        }
        return oldValue;
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


    $.fn.masterInput.refreshFieldTranformers = function(fieldParams)
    {
        debug("fieldParams", fieldParams, "refreshFieldTranformers");
        
        if (fieldParams.item.is('select'))
        {
            if ($.fn.selectpicker)
            {
                fieldParams.item.selectpicker('refresh');
            }
        }
        
    }


    $.fn.masterInput.defaults = 
    {
        masterValueName       : 'id', 
        triggerChangeOnStart  : true,
        commonAncestor        : false, // selector or jQuery Element
        debug                 : false,

        // Pour Rafraichir le champ
        refresh               : false, // Rafraichir via Ajax
        ajaxUrl               : null, // Ajax Request URL
        ajaxMethod            : 'POST', // méthode d'envoi
        requestParams         : {}, // Autres champs qu'on voudrait envoyer avec la requête
        sendSlaveDataName     : false,// Mets le nom de la variable qui va contenir la valeur du slave
        acceptEmptyData       : false, // la requête est-elle envoyée même s'il n'y a aucune donnée?
        disableIfEmpty        : false,
        autoRefresh           : false,
        responseAsValue       : false,

        // Pour afficher/cacher le champ
        show                  : false, // afficher ou cacher
        parentToHide          : false, // selector, jQuery Element of the parent to hide
        clearSibling          : true, // efface egalement les autres champs dans le parent à cacher
        showOnValues          : ['__other_choice'], // La valeur other
        clearOnHide           : true, // Pour nettoyer le champ lorsqu'il est caché
        disablableField       : false, // Lorsque le champ est caché, il est également totalement désactivé
        putReadOnly           : true, // Lorsque le champ est caché, il est également totalement désactivé
        hideItem              : true, // l'élément peut être caché ou simplement désactivé

        /*inputs: [ // selector, jQuery Element
            {
                item: '.selector' // jQuery Element
                commonAncestor: // selector or jQuery Element
                ajaxUrl: // if specific
                ajaxMethod: // if specific
                sendSlaveDataName: // if specific
                refresh: true,
            },
            {
                item: '.selector' // jQuery Element
                commonAncestor: // selector or jQuery Element
                show: true, // optionnel
                parentToHide: // selector, jQuery Element of the parent to hide
                clearOnHide: true // Pour nettoyer le champ lorsqu'il est caché
                showOnValues: ['__other_choice'], // La valeur other
            }
        ]*/

    };

})( jQuery );
