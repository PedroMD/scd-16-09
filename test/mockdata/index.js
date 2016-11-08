"use strict";

const data = module.exports = {};

data.duplicateParameterObj = {
  "name": "pressure",
  "units": "Pa"
};

data.parametersArray = [{
  "name": "pressure",
  "units": "Pa"
},
{
  "name": "temperature",
  "units": "K"
}];

data.usersArray = [
  {
    "email": "Flon1947@fleckens.hu",
    "password": "1234"
  },
  {
    "email": "Phright1958@rhyta.com",
    "password": "1234"
  },
  {
    "email": "Murn1933@fleckens.hu",
    "password": "1234"
  }
];

// will be called when testing POST /users/{userId}/rules
// unit test will then add the needed paramId
data.ruleToBeAddedToUser = {
  "threshold": 30
};

data.rulesArrayAux = [
  {
    "emails": ["Flon1947@fleckens.hu"],
    "threshold": 50,
    "name": "pressure"
  },
  {
    "emails": ["Flon1947@fleckens.hu"],
    "threshold": 100,
    "name": "temperature"
  },
  {
    "emails": ["Phright1958@rhyta.com"],
    "threshold": 50,
    "name": "pressure"
  },
  {
    "emails": ["Phright1958@rhyta.com", "Murn1933@fleckens.hu"],
    "threshold": 120,
    "name": "temperature"
  }
];
