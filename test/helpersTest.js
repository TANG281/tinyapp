const { assert } = require('chai');
const { getUserByEmail, generateRandomString } = require('../helpers.js');
const e = require('express');
const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', () => {
  it('should return a user with valid email', () => {
    const output = getUserByEmail("user@example.com", testUsers);
    const expect = {
      id: "userRandomID",
      email: "user@example.com",
      password: "purple-monkey-dinosaur"
    };
    assert.deepEqual(output, expect);
  });
  it('should return undefined with invalid email', () => {
    const output = getUserByEmail("abc@def.com", testUsers);
    const expect = undefined;
    assert.equal(output, expect);
  });
});

describe('generateRandomString', () => {
  it('should return a random string with length of 6 characters', () => {
    const randomString = generateRandomString(6);
    const output = randomString.length;
    const expect = 6;
    assert.equal(output, expect);
  });
});