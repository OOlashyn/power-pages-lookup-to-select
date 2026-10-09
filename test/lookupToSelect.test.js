const $ = require("jquery");
const {
    renderLookup,
    renderLookups,
    search,
    renderedOptions,
    renderedGroups,
    renderedMessage,
    selectOption,
    flushTimers,
    cleanup
} = require("./helpers");

const FIELD_ID = "dwctst_employer";
const SELECT_ID = `${FIELD_ID}_dwcSelect2`;

const baseOptions = {
    idFieldName: "accountid",
    textFieldName: "name",
    entitySetName: "accounts",
    targetTableLogicalName: "account",
    delay: 0
};

// getData stub returning provided records synchronously
const staticGetData = records => (term, success) => success({ value: records });

afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
    delete window.shell;
    delete window.validateLoginSession;
});

describe("options validation", () => {
    beforeEach(() => renderLookup(FIELD_ID));

    test("throws meaningful error when called without options", () => {
        expect(() => $(`#${FIELD_ID}`).lookupToSelect()).toThrow("idFieldName is required");
    });

    test("throws when targetTableLogicalName is missing", () => {
        const { targetTableLogicalName, ...options } = baseOptions;
        expect(() => $(`#${FIELD_ID}`).lookupToSelect(options)).toThrow("targetTableLogicalName is required");
    });

    test("throws when entitySetName is missing and getData is not provided", () => {
        const { entitySetName, ...options } = baseOptions;
        expect(() => $(`#${FIELD_ID}`).lookupToSelect(options)).toThrow("entitySetName is required");
    });

    test("does not require id/text field names for local data", () => {
        expect(() => $(`#${FIELD_ID}`).lookupToSelect({
            data: [{ id: "1", text: "Apple" }],
            targetTableLogicalName: "account"
        })).not.toThrow();
    });
});

describe("initialization", () => {
    test("replaces original lookup with select2 control and returns jQuery for chaining", () => {
        renderLookup(FIELD_ID);
        const field = $(`#${FIELD_ID}`);

        const result = field.lookupToSelect(baseOptions);

        expect(result).toBe(field);
        const sel = $(`#${SELECT_ID}`);
        expect(sel.length).toBe(1);
        expect(sel.data("select2")).toBeDefined();
        expect(sel.prev().is(field.parent())).toBe(true);
        expect(field.parent().css("display")).toBe("none");
        expect(sel.next(".select2").css("width")).toBe("100%");
    });

    test("initializes every matched lookup", () => {
        renderLookups("lookup_one", "lookup_two");

        $("#lookup_one, #lookup_two").lookupToSelect(baseOptions);

        expect($("#lookup_one_dwcSelect2").data("select2")).toBeDefined();
        expect($("#lookup_two_dwcSelect2").data("select2")).toBeDefined();
    });

    test("does not create duplicate controls when initialized twice", () => {
        renderLookup(FIELD_ID);
        const warn = jest.spyOn(console, "warn").mockImplementation(() => { });

        $(`#${FIELD_ID}`).lookupToSelect(baseOptions);
        $(`#${FIELD_ID}`).lookupToSelect(baseOptions);

        expect($(`[id='${SELECT_ID}']`).length).toBe(1);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("already initialized"));
    });

    test("shows existing lookup value as selected option", () => {
        renderLookup(FIELD_ID, { value: "acc-1", name: "Contoso", entityName: "account" });

        $(`#${FIELD_ID}`).lookupToSelect(baseOptions);

        const selected = $(`#${SELECT_ID}`).select2("data")[0];
        expect(selected.id).toBe("acc-1");
        expect(selected.text).toBe("Contoso");
    });

    test("does not interpret existing lookup name as HTML", () => {
        const maliciousName = "<img src=x onerror=\"window.__xss = true\">";
        renderLookup(FIELD_ID, { value: "acc-1", name: maliciousName });

        $(`#${FIELD_ID}`).lookupToSelect(baseOptions);

        expect(document.querySelector("img")).toBeNull();
        expect($(`#${SELECT_ID} option:selected`).text()).toBe(maliciousName);
    });

    test("is disabled when original lookup is disabled", () => {
        renderLookup(FIELD_ID);
        $(`#${FIELD_ID}_name`).prop("disabled", true);

        $(`#${FIELD_ID}`).lookupToSelect(baseOptions);

        expect($(`#${SELECT_ID}`).prop("disabled")).toBe(true);
        expect($(`#${SELECT_ID}`).next(".select2").hasClass("select2-container--disabled")).toBe(true);
    });

    test("labels select2 control with original lookup label", () => {
        renderLookup(FIELD_ID);

        $(`#${FIELD_ID}`).lookupToSelect(baseOptions);

        const labelledBy = $(`#${SELECT_ID}`).next(".select2").find(".select2-selection").attr("aria-labelledby");
        expect(labelledBy.split(" ")).toContain(`${FIELD_ID}_label`);
    });
});

describe("syncing selection with original lookup", () => {
    const records = [
        { accountid: "acc-1", name: "Contoso" },
        { accountid: "acc-2", name: "Fabrikam" }
    ];

    test("populates lookup fields and triggers change on selection", () => {
        renderLookup(FIELD_ID);
        const onChange = jest.fn();
        $(`#${FIELD_ID}`).on("change", onChange);
        $(`#${FIELD_ID}`).lookupToSelect({ ...baseOptions, getData: staticGetData(records) });

        search(SELECT_ID, "");
        selectOption("Fabrikam");

        expect($(`#${FIELD_ID}`).val()).toBe("acc-2");
        expect($(`#${FIELD_ID}_name`).val()).toBe("Fabrikam");
        expect($(`#${FIELD_ID}_entityname`).val()).toBe("account");
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    test("clears lookup fields when selection is cleared", () => {
        renderLookup(FIELD_ID, { value: "acc-1", name: "Contoso", entityName: "account" });
        $(`#${FIELD_ID}`).lookupToSelect({ ...baseOptions, allowClear: true, getData: staticGetData([]) });

        $(`#${SELECT_ID}`).next(".select2").find(".select2-selection__clear").trigger("mousedown");

        expect($(`#${FIELD_ID}`).val()).toBe("");
        expect($(`#${FIELD_ID}_name`).val()).toBe("");
        expect($(`#${FIELD_ID}_entityname`).val()).toBe("");
    });
});

describe("results processing", () => {
    beforeEach(() => renderLookup(FIELD_ID));

    test("keeps record fields and maps id/text from configured fields", () => {
        // record has its own "text" column that must not override display text
        const records = [{ accountid: "acc-1", name: "Contoso", text: "other", city: "Seattle" }];
        $(`#${FIELD_ID}`).lookupToSelect({ ...baseOptions, getData: staticGetData(records) });

        search(SELECT_ID, "");
        selectOption("Contoso");

        const selected = $(`#${SELECT_ID}`).select2("data")[0];
        expect(selected.id).toBe("acc-1");
        expect(selected.text).toBe("Contoso");
        expect(selected.city).toBe("Seattle");
    });

    test("groups results preserving order and falls back to formatted value", () => {
        const records = [
            { accountid: "a", name: "Alpha", industrycode: 3, "industrycode@OData.Community.Display.V1.FormattedValue": "Retail" },
            { accountid: "b", name: "Beta", industrycode: 1, "industrycode@OData.Community.Display.V1.FormattedValue": "Accounting" },
            { accountid: "c", name: "Gamma", industrycode: 3, "industrycode@OData.Community.Display.V1.FormattedValue": "Retail" }
        ];
        $(`#${FIELD_ID}`).lookupToSelect({ ...baseOptions, groupByFieldName: "industrycode", getData: staticGetData(records) });

        search(SELECT_ID, "");

        expect(renderedGroups()).toEqual(["Retail", "Accounting"]);
        expect(renderedOptions()).toEqual(["Alpha", "Gamma", "Beta"]);
    });

    test("uses groupByTextFieldName for group labels when provided", () => {
        const records = [{ accountid: "a", name: "Alpha", _country_value: "c1", countryname: "Canada" }];
        $(`#${FIELD_ID}`).lookupToSelect({
            ...baseOptions,
            groupByFieldName: "_country_value",
            groupByTextFieldName: "countryname",
            getData: staticGetData(records)
        });

        search(SELECT_ID, "");

        expect(renderedGroups()).toEqual(["Canada"]);
    });

    test("handles responses without value array", () => {
        $(`#${FIELD_ID}`).lookupToSelect({ ...baseOptions, getData: (term, success) => success("<html>login</html>") });

        expect(() => search(SELECT_ID, "")).not.toThrow();
        expect(renderedOptions()).toEqual([]);
    });

    test("ignores responses of outdated searches", () => {
        const pending = [];
        $(`#${FIELD_ID}`).lookupToSelect({
            ...baseOptions,
            getData: (term, success) => { pending.push({ term, success }); }
        });

        search(SELECT_ID, "mi");
        search(SELECT_ID, "micro");
        // latest search responds first, outdated one responds later
        pending[1].success({ value: [{ accountid: "1", name: "Microsoft" }] });
        pending[0].success({ value: [{ accountid: "2", name: "Mighty Inc" }] });

        expect(renderedOptions()).toEqual(["Microsoft"]);
    });
});

describe("default Web API data retrieval", () => {
    let requests;

    beforeEach(() => {
        renderLookup(FIELD_ID);
        requests = [];

        window.shell = { getTokenDeferred: () => $.Deferred().resolve("csrf-token").promise() };
        window.validateLoginSession = jest.fn((data, textStatus, jqXHR, callback) => callback(data));

        jest.spyOn($, "ajax").mockImplementation(options => {
            const deferred = $.Deferred();
            const jqXHR = deferred.promise();
            jqXHR.abort = jest.fn();
            requests.push({ options, deferred, jqXHR });
            return jqXHR;
        });
    });

    test("sends escaped search term, $top and verification token", () => {
        $(`#${FIELD_ID}`).lookupToSelect(baseOptions);

        search(SELECT_ID, "O'Brien & Co");

        const { url, headers } = requests[0].options;
        expect(url).toBe("/_api/accounts?$select=accountid,name&$orderby=name asc&$top=50&$filter=startswith(name,'O''Brien%20%26%20Co')");
        expect(headers.__RequestVerificationToken).toBe("csrf-token");
        expect(headers.Prefer).toBe("odata.include-annotations=*");
    });

    test("omits filter for empty search and $top when maxResults is disabled", () => {
        $(`#${FIELD_ID}`).lookupToSelect({ ...baseOptions, maxResults: null });

        search(SELECT_ID, "");

        expect(requests[0].options.url).toBe("/_api/accounts?$select=accountid,name&$orderby=name asc");
    });

    test("renders results after login session validation", () => {
        $(`#${FIELD_ID}`).lookupToSelect(baseOptions);

        search(SELECT_ID, "con");
        requests[0].deferred.resolve({ value: [{ accountid: "acc-1", name: "Contoso" }] }, "success", requests[0].jqXHR);

        expect(window.validateLoginSession).toHaveBeenCalled();
        expect(renderedOptions()).toEqual(["Contoso"]);
    });

    test("does not render results when login session is invalid", () => {
        window.validateLoginSession = jest.fn(); // expired session - callback is never invoked
        $(`#${FIELD_ID}`).lookupToSelect(baseOptions);

        search(SELECT_ID, "con");
        requests[0].deferred.resolve("<html>login</html>", "success", requests[0].jqXHR);

        expect(renderedOptions()).toEqual([]);
    });

    test("aborts in-flight request when new search starts", () => {
        $(`#${FIELD_ID}`).lookupToSelect(baseOptions);

        search(SELECT_ID, "mi");
        search(SELECT_ID, "micro");

        expect(requests[0].jqXHR.abort).toHaveBeenCalled();
        expect(requests[1].jqXHR.abort).not.toHaveBeenCalled();
    });

    test("shows error message when request fails", async () => {
        $(`#${FIELD_ID}`).lookupToSelect(baseOptions);

        search(SELECT_ID, "con");
        requests[0].deferred.reject({ status: 500 }, "error");
        await flushTimers();

        expect(renderedMessage()).toBe("The results could not be loaded.");
    });

    test("shows error message when Web API wrapper is not available", async () => {
        delete window.shell;
        const error = jest.spyOn(console, "error").mockImplementation(() => { });
        $(`#${FIELD_ID}`).lookupToSelect(baseOptions);

        search(SELECT_ID, "con");
        await flushTimers();

        expect(error).toHaveBeenCalled();
        expect(renderedMessage()).toBe("The results could not be loaded.");
    });
});
