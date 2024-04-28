---
title: Configurations
description: List of available configuration options
---

| <div style="width:170px">Option</div> | Type | Requirements | Description |
| :----------- | :---- | :------- | :----------- |
| `idFieldName` | string | **required** | Id field of the table you are fetching data from |
| `textFieldName` | string | **required** |  Primary name field of the table you are fetching data from |
| `entitySetName` | string | **required*** | Identified table collection name within Web API. Only **required** if `getData` or `data` options are not provided. See more details on how to find it/use it in [official Power Page documentation](https://learn.microsoft.com/en-us/power-pages/configure/web-api-overview#using-entitysetname) |
| `targetTableLogicalName` | string | **required** | Logical name of your table |
| `minimumInputLength` | number | **optional** | The number of symbols users needs to enter before triggering search functionality |
| `delay` | number | **optional** | The number of milliseconds to wait for the user to stop typing before issuing the ajax request  |
| `placeholder` | string | **optional** | Placeholder of the input |
| `getData` | function | **optional** | Function to fetch necessary options based on the user input. See [Data sources](/power-pages-lookup-to-select/recipes/advance-filtering/) for more details |
| `data` | array | **optional** | Array of available options. See [Data sources](/power-pages-lookup-to-select/recipes/data-sources/) for more details |