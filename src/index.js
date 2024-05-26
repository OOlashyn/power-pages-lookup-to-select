(function ($) {
    // define internal istance of MS provided Web API wrapper
    // to support scenario without custom function to handle
    // data retrival 
    function safeAjax(ajaxOptions) {
        var deferredAjax = $.Deferred();

        shell.getTokenDeferred().done(function (token) {
            // add headers for AJAX
            if (!ajaxOptions.headers) {
                $.extend(ajaxOptions, {
                    headers: {
                        "__RequestVerificationToken": token
                    }
                });
            } else {
                ajaxOptions.headers["__RequestVerificationToken"] = token;
            }
            $.ajax(ajaxOptions)
                .done(function (data, textStatus, jqXHR) {
                    validateLoginSession(data, textStatus, jqXHR, deferredAjax.resolve);
                }).fail(deferredAjax.reject); //AJAX
        }).fail(function () {
            deferredAjax.rejectWith(this, arguments); // on token failure pass the token AJAX and args
        });

        return deferredAjax.promise();
    }

    $.fn.lookupToSelect = function (options) {

        // validate required options
        if (!options.idFieldName && !options.data) {
            throw new Error("lookupToSelect error: idFieldName is required for external data source");
        }

        if (!options.textFieldName && !options.data) {
            throw new Error("lookupToSelect error: textFieldName is required for external data source");
        }

        if (!options.entitySetName && !options.data && !options.getData) {
            throw new Error("lookupToSelect error: entitySetName is required for external data source if no getData is provided");
        }

        // This is the easiest way to have default options.
        const settings = $.extend({
            // These are the defaults.
            placeholder: "Search by typing",
            delay: 250
        }, options);

        // handle data retrieval if getData function is not provided
        if (!settings.getData && !settings.data) {
            settings.getData = function (searchTerm, successHandler, errorHandler) {
                const select = `$select=${settings.idFieldName},${settings.textFieldName}&$orderby=${settings.textFieldName} asc`;
                const filter = searchTerm ? `&$filter=startswith(${settings.textFieldName},'${searchTerm}')` : "";
                const options = select + filter;

                safeAjax({
                    type: "GET",
                    url: `/_api/${settings.entitySetName}?${options}`,
                    contentType: "application/json",
                    headers: {
                        "Prefer": "odata.include-annotations=*"
                    },
                    success: successHandler,
                    error: errorHandler
                });
            }
        }

        // generate select element to which select2 will be attached
        const fieldId = this.attr('id');
        const customSelectId = `${fieldId}_dwcSelect2`;

        const sel = $(`<select id='${customSelectId}'>`);
        this.parent().after(sel);

        const initialValue = this.val();

        if (initialValue) {
            const initialValueText = $(`#${fieldId}_name`).val();
            sel.append(`<option value='${initialValue}'>${initialValueText}</option>`)
        }

        // define select2Config object
        // TODO add support to pass the whole object as parameter
        const select2Config = {
            placeholder: settings.placeholder,
            minimumInputLength: settings.minimumInputLength,
        };

        // local data source config
        if (settings.data) {
            select2Config.data = settings.data;
        }

        // external data source config
        if (settings.getData) {
            select2Config.ajax = {
                // delay request by specified amount
                delay: settings.delay,
                // define custom request logic
                transport: function (params, success, failure) {
                    settings.getData(params.data.term, success, failure);
                },
                processResults: function (data) {
                    let formattedResponse;

                    // grouping results if groupBy is provided
                    // and transforming data to the expected format
                    if (settings.groupByFieldName) {
                        formattedResponse = data.value.reduce((acc, el) => {
                            const formattedElement = $.extend(
                                {
                                    id: el[settings.idFieldName],
                                    text: el[settings.textFieldName]
                                },
                                el
                            );

                            const groupValue = formattedElement[settings.groupByFieldName];
                            const groupText = formattedElement[settings.groupByTextFieldName];
                            if (!acc[groupValue]) {
                                acc[groupValue] = {
                                    text: groupText,
                                    children: []
                                };
                            }
                            acc[groupValue].children.push(formattedElement);
                            return acc;
                        }, {});
                        formattedResponse = Object.values(formattedResponse);
                    } else {
                        // transform response to the select2 expected format
                        formattedResponse = data.value.map(el => $.extend(
                            {
                                id: el[settings.idFieldName],
                                text: el[settings.textFieldName]
                            },
                            el
                        ));
                    }

                    return {
                        results: formattedResponse
                    };
                }
            }
        }

        // custom option rendering
        if (settings.optionRenderer) {
            select2Config.templateResult = settings.optionRenderer;
        }

        // custom result rendering
        if (settings.resultRenderer) {
            select2Config.templateSelection  = settings.resultRenderer;
        }


        // initiate select2
        sel.select2(select2Config);

        // add onchange function to populate actual lookup
        sel.on("change", function () {
            const selectedValue = sel.val();
            const selectedValueLabel = $(`#${customSelectId} option:selected`).text();

            $(`#${fieldId}`).val(selectedValue);
            $(`#${fieldId}_entityname`).val(settings.targetTableLogicalName);
            $(`#${fieldId}_name`).val(selectedValueLabel);
        });

        // hide original lookup
        this.parent().hide();
    };

}(jQuery));