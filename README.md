# Early Hints Component

## Overview

This HarperDB component is designed to provide **Early Hints** for key assets including:

- Main product images

The component exposes a **single API endpoint** that accepts a page URL and returns the relevant early hints for that page, including CSS/JS and image assets.

## Getting Started

### Runnning locally

1. `git clone https://github.com/HarperDB/early-hints-template.git`
2. `cd early-hints-template`
3. `npm install`
4. `npm run build`
5. `harperdb run .`

This assumes you have the Harper stack already installed. [Install Harper](https://docs.harperdb.io/docs/deployments/install-harperdb) globally.

### Deployement

The component can be deployed using the `Deploy Application` Github action. By default, the main branch will be deployed, but any branch or SHA can be specified for the deployment.

## Usage

### Endpoints

| Endpoint           | Description                                                     | Query Parameters           |
|--------------------| --------------------------------------------------------------- | -------------------------- |
| `/hints`           | Supports GET request to return early hints for a given page URL | `q` = full URL of the page |                   |                            |
| `/product-images/` | Direct REST interface for the ProductImages table               |                            |

The Harper REST API gives low level control over your data. For a full description of what the REST API can do and how to use if your can refer to its [documentation](https://docs.harperdb.io/docs/developers/rest).
This REST interface for the various tables can be used to manually manipulate the data. See the [Data Model](#data-model) section below for details on the structure of each table.

### Example Request

```
GET /hints?q=https://www.harpersystems.dev/solutions/digital-commerce
```

### Example Response

```json
"<https://cdn.prod.website-files.com/6374050260446c42f94dc90f/6644eeb1c8d4b777b1a2de5d_hand-holding-credit-card-and-using-laptop-with-sma-2023-11-27-05-26-06-utc%20(1).jpg;rel=preload;as=image;crossorigin>,<https://cdn.prod.website-files.com/6374050260446c42f94dc90f/6670de15feacc90cb009ce32_starry-night-sky-glowing-stars-in-space-galaxy-b-2024-05-20-20-04-39-utc%20(1).jpg;rel=preload;as=image;crossorigin>"
```

## Data Model

### ProductImages Table

| Name      | Type                     | Description                                      |
| --------- | ------------------------ | ------------------------------------------------ |
| `pageUrl` | String **(Primary Key)** | Page the product image is found on               |
| `hint`    | String                   | Main product image url to be sent as early hints |

## Edgeworker

The **edgeworker** acts as a forwarder for hint generation. It takes the client's original URL request and sends it to Harper via GTM to the `/hints` endpoint. The response from Harper (an array of hint strings) is then used to set the `PMUSER_103_HINTS` variable.

This variable is interpreted by the CDN edge layer to emit a `103 Early Hints` response, allowing browsers to start fetching assets before the main HTML payload arrives.

The variable has a max character length of 1024. Exceeding this limit will result in the edgeworker returning an error.
