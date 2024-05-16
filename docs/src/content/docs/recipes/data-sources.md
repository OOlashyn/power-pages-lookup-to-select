---
title: Available data sources
description: Describes available data sources for LtS
---

In simplest scenarios, defined in [Basic Usage page](/power-pages-lookup-to-select/guides/basicusage/), you just need to pass couple of parameters.
However, in most cases, you would need to define your own data retrieval function to support more complex business logic.

## getData

To support custom data retrieval LtS exposes `getData` function. This function doesn't need to return any data and expects 3 parameters:
* `searchTerm` - LtS will pass searchTerm that your user is currently typing, so you can process it within your data retrival logic
* `successHandler` - function provided by Select2 to handle success and process results
* `errorHandler`- function provided by Select2 to handle errors

So let's say you need to filter your employers (accounts) by name. To do so we can write custom getEmployerByName function and pass it as a getData parameter

```js
function getEmployerByName(employerName, successHandler, errorHandler) {
    const select = `$select=accountid,name&$orderby=name asc`;
    const filter = employerName ? `&$filter=startswith(name,'${employerName}')` : "";
    const options = select+filter;
    webapi.safeAjax({
        type: "GET",
        url: `/_api/accounts?${options}`,
        contentType: "application/json",
        success: successHandler,
        error: errorHandler
    });
}

$(document).ready(function(){
    $("#dwctst_employer").lookupToSelect({
        getData: getEmployerByName,
        placeholder: 'Search for an employer',
        idFieldName: 'accountid',
        textFieldName: 'name',
        targetTableLogicalName: 'account'
    });
});

```

## data

You might also have certain scenarios when you want to show only predefined list of data. In that case you can supply `data` variable to the LtS.
`data` needs to be an array of objects, each object with 2 properties: **id** and **text**. 

For all supported data formats please visit [Select2 data format documentation](https://select2.org/data-sources/formats).

```js
const data = [
    {
        id: 'b7ea6276-3e37-4dba-b020-accbb9450b5c',
        text: 'Apple'
    },
    {
        id: 'fd80a639-0f2c-46c0-a902-e0bb947235a9',
        text: 'Amazon'
    },
    {
        id: 'b858e2b8-bd54-4359-804c-7c4dd7a00124',
        text: 'Google'
    },
    {
        id: 'b93861f8-4889-4b56-8c34-e9085f1c6e52',
        text: 'Microsoft'
    }
];

$(document).ready(function(){
    $("#dwctst_employer").lookupToSelect({
        data: data,
        placeholder: 'Search for an employer',
        idFieldName: 'accountid',
        textFieldName: 'name',
        targetTableLogicalName: 'account'
    });
});
```