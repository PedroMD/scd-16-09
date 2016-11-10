> Ubiwhere&#39;s cool assignment!

## About

This project uses [Node.js](https://nodejs.org/en/), [Feathers](http://feathersjs.com), an open source web framework for building modern real-time applications, and [MongoDB](https://www.mongodb.com) as DB.

## Try it

### Server

The app has been deployed to Heroku, so you can point your REST client to [https://scd-16-09.herokuapp.com](https://scd-16-09.herokuapp.com)
*Swagger specification can also be explored by visiting [https://scd-16-09.herokuapp.com](https://scd-16-09.herokuapp.com) & Models at [https://scd-16-09.herokuapp.com/models](https://scd-16-09.herokuapp.com/models)*

### Postman Collections



## Documentation

The RESTful API was documented using the [Swagger specification](http://swagger.io/), so whenever you start the server, you can access the Swagger-ui in http://localhost:3030/ as the API is also serving as a simple web server.

*You can actually use this page to interact with the server as well, as it also works as a REST client.*

### Models & Services design

There are 5 different services in this API, each with their own Model:
* parameters
* events
* rules
* users
* alerts

All of them have proper CRUD methods, and some are related to each other. Visiting the API documentation helps to visualize this. Swagger-ui, however, does not easily show the defined Models, so it might help visiting the page http://localhost:3030/models.

## Configuration

All relevant configuration (listening ports, DB connection, etc.) can be found in the config folder. F

or instance, if you do not want to clean the Database once the unit testing is done (which can also be used to generate random data),
set `testing.cleanDB` to `false`. This is useful if you just want to use the unit testing for scaffolding purposes. Just make sure you remove all hooks preventing you to delete the protected services (check [NOTES](#notes)), or just do it via the mongo shell.


## Getting Started

1. Download this repo

2. Make sure you have all latest stable version of [NodeJS](https://nodejs.org/) & [npm](https://www.npmjs.com/) & [MongoDB](https://www.mongodb.com/download-center?jmp=nav) installed

3. Install dependencies

    ```
    cd path/to/scd-16-09; npm install
    ```

4. Start the server

    ```
    npm start
    ```

## NOTES

As documented, some services do not allow for external DELETE requests, so if you really want to mess with it, make sure you check each service's "before" hooks and comment out the
```
hooks.iff(hooks.isProvider("external"), hooks.disable("external"))
```
and/or
```
onlyIfSingleResourceOrInternal()
```
Further explanation can be found on the documentation page.

## Testing

Simply run `npm test` to test all unit testing in /test/api.test.js
### Scaffolding

You can issue `npm test` to generate some random data only, if you tell it not to clean the DB after all tests are done. Just set the `testing.cleanDB` to false, on your config file (default.json, if you haven't specified otherwise)


## Changelog

__0.1__

- Initial release

## License

Copyright (c) 2016

Licensed under the [MIT license](LICENSE).
