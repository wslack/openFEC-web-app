## Campaign finance for everyone
The Federal Election Commission (FEC) releases information to the public about money that’s raised and spent in federal elections — that’s elections for US president, Senate, and House of Representatives. 

Are you interested in seeing how much money a candidate raised? Or spent? How much debt they took on? Who contributed to their campaign? The FEC is the authoritative source for that information.

betaFEC is a collaboration between [18F](http://18f.gsa.gov) and the FEC. It aims to make campaign finance information more accessible (and understandable) to all users. 

## FEC repositories 
We welcome you to explore our FEC repositories, make suggestions, and contribute to our code. Our repositories are:

- [FEC](https://github.com/18F/fec): a general discussion forum. We [compile feedback](https://github.com/18F/fec/issues) from betaFEC’s feedback widget here, and this is the best place to submit general feedback.
- [openFEC](https://github.com/18F/openfec): betaFEC’s API
- [openFEC-web-app](https://github.com/18f/openfec-web-app): the betaFEC web app for exploring campaign finance data
- [fec-style](https://github.com/18F/fec-style): shared styles and user interface components
- [fec-cms](https://github.com/18F/fec-cms): the content management system (CMS) for betaFEC

## How you can help
We’re thrilled you want to get involved! Here are some suggestions:
- Check out our [contributing guidelines](https://github.com/18F/openfec/blob/master/CONTRIBUTING.md). Then, [file an issue](https://github.com/18F/fec/issues) or submit a pull request.
- [Send us an email](mailto:betafeedback@fec.gov).
- If you’re a developer, follow the installation instructions in the README.md page of each repository to run the apps on your computer. 

## Copyright and licensing
This project is in the public domain within the United States, and we waive worldwide copyright and related rights through [CC0 universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/). Read more on our license page.

A few restrictions limit the way you can use FEC data. For example, you can’t use contributor lists for commercial purposes or to solicit donations. Learn more on FEC.gov.

---
**Develop**
[![Build Status](https://img.shields.io/travis/18F/openFEC-web-app/develop.svg)](https://travis-ci.org/18F/openFEC-web-app)
[![Test Coverage](https://img.shields.io/codecov/c/github/18F/openFEC-web-app/develop.svg)](https://codecov.io/github/18F/openFEC-web-app)

**Master**
[![Build Status](https://img.shields.io/travis/18F/openFEC-web-app/master.svg)](https://travis-ci.org/18F/openFEC-web-app)
[![Test Coverage](https://img.shields.io/codecov/c/github/18F/openFEC-web-app/master.svg)](https://codecov.io/github/18F/openFEC-web-app)
[![Code Climate](https://img.shields.io/codeclimate/github/18F/openFEC-web-app.svg)](https://codeclimate.com/github/18F/openFEC-web-app)
[![Dependencies](https://img.shields.io/gemnasium/18F/openFEC-web-app.svg)](https://gemnasium.com/18F/openFEC-web-app)

### Installing
This application is in [Flask](http://flask.pocoo.org/). Client side features are managed using [Browserify](http://browserify.org/) and [npm](https://www.npmjs.org/).

It uses Python version 3.4. Its recommended that you create a [virtualenv](http://docs.python-guide.org/en/latest/dev/virtualenvs/) before installing Python dependencies.

Install Python dependencies:

    $ pip install -r requirements.txt

Install client side dependencies:

    $ npm install -g browserify
    $ npm install

If you plan to do client side JS developent, you will want to install [Watchify](https://github.com/substack/watchify):
```
$ npm install -g watchify
```

### Configuration

The Flask app talks to an API for data. See [openFEC](http://github.com/18F/openFEC).

The app has HTTP auth enabled. You will need to set environment variables with your desired username and password.
Those vars are `FEC_WEB_USERNAME` and `FEC_WEB_PASSWORD`. There are other config environment variables that you
can set, but that have defaults. You can see those in `openfecwebapp/config.py`.

### Run server
To make the site fully functional, you will need to compile the client side JS and CSS:

    $ npm run build

Then start the server:

    $ python __init__.py

To run the server in debug mode set:

    $ export FEC_WEB_DEBUG=true

To use styles served from a custom location (e.g., if developing against a local `fec-style`):

    $ export FEC_WEB_STYLE_URL=http://localhost:8080/css/styles.css

To be able to have links between this app and a local installation of the cms:

    $ export FEC_CMS_URL=http://localhost:8000
    
If you'd like the app to cache API requests it makes, use the `--cached` flag:

    $ python __init__.py --cached

### Development
To compile client side JS once:

    $ npm run build-js

Compile Sass once:

    $ npm run build-sass

Compile JS as changes are made:

    $ npm run watch-js

Compile Sass as changes are made:

    $ npm run watch-sass

### Deployment

See directions in the 18F/openFEC repo.

#### Caching

To avoid repeated requests to the OpenFEC API, the webapp can store recent API responses
in a small in-memory cache. The cache can be enabled by setting the `FEC_WEB_CACHE`
environment variable; the size of the cache, in items, is controlled by the
`FEC_WEB_CACHE_SIZE` environment variable. When the cache is enabled, views may
be stale for up to the cache duration set by the API.

### Run Tests
#### Unit Tests

    $ py.test

#### Browser Tests
First, install [PhantomJS](http://phantomjs.org/).

Configure development environment:

    $ unset FEC_WEB_API_KEY
    $ export FEC_WEB_API_URL=http://fec-dev-api.18f.gov
    $ export FEC_WEB_TEST=true

Run development app server:

    $ python __init__.py

While app is running, run tests:

    $ py.test --selenium

If the development API is down or for testing with feature branches of the API,
a local API server can be used:

    $ unset FEC_WEB_API_URL

#### Git Hooks

This repo includes optional post-merge and post-checkout hooks to ensure that
dependencies and compiled assets are up to date. If enabled, these hooks will
update Python and Node dependencies, and rebuild compiled JS and CSS files,
on checking out or merging changes to `requirements.txt`, `package.json`,
or source JS or SCSS files. To enable the hooks, run

    $ invoke add_hooks

To disable, run

    $ invoke remove_hooks
