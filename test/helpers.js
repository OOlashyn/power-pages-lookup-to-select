const $ = require("jquery");

// markup mimicking Power Pages lookup control rendered on basic/advanced forms
function lookupMarkup(id) {
    return `
        <div class="cell lookup form-control-cell">
            <div class="info"><label for="${id}_name" id="${id}_label">Lookup ${id}</label></div>
            <div class="control">
                <div class="input-group">
                    <input type="text" readonly class="text form-control lookup" id="${id}_name">
                    <input type="hidden" id="${id}">
                    <input type="hidden" id="${id}_entityname">
                    <div class="input-group-btn">
                        <button type="button" class="btn launchentitylookup">Search</button>
                    </div>
                </div>
            </div>
        </div>`;
}

function renderLookups(...ids) {
    document.body.innerHTML = ids.map(lookupMarkup).join("");
}

function renderLookup(id = "dwctst_employer", { value = "", name = "", entityName = "" } = {}) {
    renderLookups(id);
    // set values via jQuery so test data is never parsed as HTML
    $(`#${id}`).val(value);
    $(`#${id}_name`).val(name);
    $(`#${id}_entityname`).val(entityName);
}

// run select2 search the same way it happens when user types
function search(selectId, term) {
    $(`#${selectId}`).data("select2").trigger("query", { term });
}

function renderedOptions() {
    return $(".select2-results__option--selectable").map((i, el) => $(el).text()).get();
}

function renderedGroups() {
    return $(".select2-results__group").map((i, el) => $(el).text()).get();
}

function renderedMessage() {
    return $(".select2-results__message").text();
}

function selectOption(text) {
    const option = $(".select2-results__option--selectable").filter((i, el) => $(el).text() === text);
    option.trigger("mouseup");
}

const flushTimers = () => new Promise(resolve => setTimeout(resolve, 0));

function cleanup() {
    $("select").each(function () {
        if ($(this).data("select2")) {
            $(this).select2("destroy");
        }
    });
    document.body.innerHTML = "";
}

module.exports = {
    renderLookup,
    renderLookups,
    search,
    renderedOptions,
    renderedGroups,
    renderedMessage,
    selectOption,
    flushTimers,
    cleanup
};
