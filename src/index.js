(function ($) {
    const PLUGIN_DATA_KEY = "lookupToSelect";
    const SELECT_ID_SUFFIX = "_dwcSelect2";
    const FORMATTED_VALUE_ANNOTATION = "@OData.Community.Display.V1.FormattedValue";

    // escape user input so it can be safely placed inside an OData
    // string literal that is part of the URL query string
    function escapeODataString(value) {
        return encodeURIComponent(String(value).replace(/'/g, "''"));
    }

    // define internal instance of MS provided Web API wrapper
    // to support scenario without custom function to handle
    // data retrieval
    function safeAjax(ajaxOptions) {
        const deferredAjax = $.Deferred();
        const promise = deferredAjax.promise();
        let jqXHR = null;
        let aborted = false;

        // allow select2 to cancel in-flight request when user keeps typing
        promise.abort = function () {
            aborted = true;
            if (jqXHR) {
                jqXHR.abort();
            }
        };

        if (typeof shell === "undefined" || typeof shell.getTokenDeferred !== "function" || typeof validateLoginSession !== "function") {
            const error = new Error("lookupToSelect error: Power Pages Web API wrapper is not available on this page. Provide custom getData function instead.");
            console.error(error);
            deferredAjax.reject(error);
            return promise;
        }

        shell.getTokenDeferred().done(function (token) {
            if (aborted) {
                return;
            }

            // add headers for AJAX
            ajaxOptions.headers = $.extend({}, ajaxOptions.headers, {
                "__RequestVerificationToken": token
            });

            jqXHR = $.ajax(ajaxOptions)
                .done(function (data, textStatus, xhr) {
                    validateLoginSession(data, textStatus, xhr, deferredAjax.resolve);
                }).fail(deferredAjax.reject); //AJAX
        }).fail(function () {
            deferredAjax.rejectWith(this, arguments); // on token failure pass the token AJAX and args
        });

        return promise;
    }

    function validateOptions(options) {
        if (!options.idFieldName && !options.data) {
            throw new Error("lookupToSelect error: idFieldName is required for external data source");
        }

        if (!options.textFieldName && !options.data) {
            throw new Error("lookupToSelect error: textFieldName is required for external data source");
        }

        if (!options.entitySetName && !options.data && !options.getData) {
            throw new Error("lookupToSelect error: entitySetName is required for external data source if no getData is provided");
        }

        if (!options.targetTableLogicalName) {
            throw new Error("lookupToSelect error: targetTableLogicalName is required");
        }
    }

    // default data retrieval via Power Pages Web API
    function createDefaultGetData(settings) {
        return function (searchTerm, successHandler, errorHandler) {
            const select = `$select=${settings.idFieldName},${settings.textFieldName}&$orderby=${settings.textFieldName} asc`;
            const top = settings.maxResults ? `&$top=${settings.maxResults}` : "";
            const filter = searchTerm ? `&$filter=startswith(${settings.textFieldName},'${escapeODataString(searchTerm)}')` : "";

            return safeAjax({
                type: "GET",
                url: `/_api/${settings.entitySetName}?${select}${top}${filter}`,
                contentType: "application/json",
                headers: {
                    "Prefer": "odata.include-annotations=*"
                }
            }).done(successHandler).fail(errorHandler);
        };
    }

    // transform record to the select2 expected format,
    // id and text always take precedence over record fields
    function toSelect2Item(record, settings) {
        return $.extend({}, record, {
            id: record[settings.idFieldName],
            text: record[settings.textFieldName]
        });
    }

    // group items preserving the order in which they were returned
    function groupItems(items, settings) {
        const groups = [];
        const groupsByValue = {};

        items.forEach(item => {
            const groupValue = item[settings.groupByFieldName];
            const groupKey = String(groupValue);

            if (!groupsByValue[groupKey]) {
                // fallback to formatted value annotation and then to raw value
                // if groupByTextFieldName is not provided
                const groupTextField = settings.groupByTextFieldName || `${settings.groupByFieldName}${FORMATTED_VALUE_ANNOTATION}`;
                let groupText = item[groupTextField];
                if (groupText == null) {
                    groupText = groupValue == null ? "" : String(groupValue);
                }

                groupsByValue[groupKey] = {
                    text: groupText,
                    children: []
                };
                groups.push(groupsByValue[groupKey]);
            }

            groupsByValue[groupKey].children.push(item);
        });

        return groups;
    }

    function createTransport(getData) {
        let latestRequestId = 0;

        return function (params, success, failure) {
            const requestId = ++latestRequestId;
            let cancelled = false;
            let transportReturned = false;

            // ignore responses of outdated or cancelled requests
            // so they cannot overwrite results of the latest search
            const isCurrent = () => !cancelled && requestId === latestRequestId;

            const onSuccess = function () {
                if (isCurrent()) {
                    success.apply(this, arguments);
                }
            };

            const onFailure = function () {
                const context = this;
                const args = arguments;

                if (!isCurrent()) {
                    return;
                }

                // select2 expects failure to be called only after transport returned
                if (!transportReturned) {
                    setTimeout(function () {
                        if (isCurrent()) {
                            failure.apply(context, args);
                        }
                    }, 0);
                    return;
                }

                failure.apply(context, args);
            };

            const request = getData(params.data.term, onSuccess, onFailure);
            transportReturned = true;

            return {
                abort: function () {
                    cancelled = true;
                    if (request && typeof request.abort === "function") {
                        request.abort();
                    }
                }
            };
        };
    }

    // link original lookup label with select2 control for screen readers
    function linkLabel(fieldId, sel) {
        const label = $(`#${fieldId}_label`).add(`label[for='${fieldId}_name']`).first();

        if (!label.length) {
            return;
        }

        let labelId = label.attr("id");
        if (!labelId) {
            labelId = `${fieldId}${SELECT_ID_SUFFIX}_label`;
            label.attr("id", labelId);
        }

        const selection = sel.next(".select2").find(".select2-selection");
        selection.attr("aria-labelledby", `${labelId} ${selection.attr("aria-labelledby") || ""}`.trim());
    }

    function initLookup(field, settings) {
        const fieldId = field.attr("id");

        if (!fieldId) {
            throw new Error("lookupToSelect error: lookup field must have an id");
        }

        // prevent duplicate controls on repeated initialization
        if (field.data(PLUGIN_DATA_KEY)) {
            console.warn(`lookupToSelect warning: lookup ${fieldId} is already initialized`);
            return;
        }

        const nameField = $(`#${fieldId}_name`);
        const entityNameField = $(`#${fieldId}_entityname`);
        const customSelectId = `${fieldId}${SELECT_ID_SUFFIX}`;

        // generate select element to which select2 will be attached
        const sel = $("<select>").attr("id", customSelectId);
        field.parent().after(sel);

        // empty option is required by select2 for placeholder and allowClear
        sel.append(new Option());

        const initialValue = field.val();

        if (initialValue) {
            // build option via DOM API so record name is never parsed as HTML
            sel.append(new Option(nameField.val() || "", initialValue, true, true));
        }

        // respect disabled state of the original lookup
        if (field.prop("disabled") || nameField.prop("disabled") || nameField.attr("aria-disabled") === "true") {
            sel.prop("disabled", true);
        }

        // define select2Config object
        // TODO add support to pass the whole object as parameter
        const select2Config = {
            placeholder: settings.placeholder,
            minimumInputLength: settings.minimumInputLength,
            // make select2 responsive
            width: "100%"
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
                transport: createTransport(settings.getData),
                processResults: function (data) {
                    const records = data && Array.isArray(data.value) ? data.value : [];
                    const items = records.map(record => toSelect2Item(record, settings));

                    return {
                        results: settings.groupByFieldName ? groupItems(items, settings) : items
                    };
                }
            };
        }

        // custom option rendering
        if (settings.optionRenderer) {
            select2Config.templateResult = settings.optionRenderer;
        }

        // custom result rendering
        if (settings.resultRenderer) {
            select2Config.templateSelection = settings.resultRenderer;
        }

        // allowClear option
        if (settings.allowClear) {
            select2Config.allowClear = true;
        }

        // initiate select2
        sel.select2(select2Config);

        linkLabel(fieldId, sel);

        // add onchange function to populate actual lookup
        sel.on("change", function () {
            const selection = sel.select2("data")[0];
            const hasValue = !!(selection && selection.id);

            field.val(hasValue ? selection.id : "");
            entityNameField.val(hasValue ? settings.targetTableLogicalName : "");
            nameField.val(hasValue ? selection.text : "");

            // trigger change event on original lookup
            field.trigger("change");
        });

        field.data(PLUGIN_DATA_KEY, { select: sel });

        // hide original lookup
        field.parent().hide();
    }

    $.fn.lookupToSelect = function (options) {
        options = options || {};

        // validate required options
        validateOptions(options);

        // This is the easiest way to have default options.
        const settings = $.extend({
            // These are the defaults.
            placeholder: "Search by typing",
            delay: 250,
            maxResults: 50
        }, options);

        // handle data retrieval if getData function is not provided
        if (!settings.getData && !settings.data) {
            settings.getData = createDefaultGetData(settings);
        }

        return this.each(function () {
            initLookup($(this), settings);
        });
    };

}(jQuery));
