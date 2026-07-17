# The Defuse Testing Guide

## 1. What is Automated Testing?
Automated testing is writing code to check your code. Instead of manually launching the game and cutting wires to see if the rules work, we write scripts that act like robots. These robots feed fake data into our functions and verify that the output is exactly what we expect.

If the output is correct, the test **Passes** (Green).
If the output is wrong, the test **Fails** (Red).

---

## 2. Our Testing Library: Vitest
We use a library called **Vitest**. Vitest is a modern, lightning-fast "test runner." It is responsible for finding our test files, executing them, and printing the results in the terminal.

### How is it configured?
There are two places where Vitest is configured in this project:

1. **`package.json`**:
   We added `"test": "vitest run"` to the `"scripts"` block. This means anytime you type `npm test` in the terminal, Node knows to launch the Vitest program.
   
2. **`vitest.config.ts`**:
   This is the settings file for Vitest. By default, Vitest searches the entire project for test files. To make it faster and cleaner, we created this config file and told it: *"Only look for files ending in `.test.ts` inside the `tests/` folder."*

---

## 3. How to Run the Tests
To run your local automated tests, simply open your terminal, ensure you are in the project folder, and run:

```bash
npm test
```

Vitest will quickly scan the `tests/` folder and print a report card showing which tests passed and which failed.

---

## 4. Understanding a Test File (`.test.ts`)
If you open a file like `tests/state/bomb.test.ts`, you will see a specific structure. There are four main building blocks in a Vitest file:

1. **`describe("...", () => { ... })` (The Group)**
   This is a folder-like container used to organize related tests together.
2. **`it("should...", () => { ... })` (The Test)**
   This is the actual code block where one specific feature is tested. (Some developers use `test()` instead of `it()`).
3. **`expect(result).toBe(expected)` (The Validator)**
   This is the core of the test. `expect` acts as a true/false gate. It has helper methods (called *matchers*) like `.toBe()`, `.toEqual()`, or `.toContain()`. If the condition is met, the test passes.
4. **Lifecycle Hooks (`beforeEach`, `afterEach`) (The Helpers)**
   These run setup or cleanup code *before* or *after* every single test. For example, clearing out old room data so every test starts fresh.

---

## 5. What Tests Do We Have?
We practice **Co-location structure**, meaning our `tests/` folder mirrors our `src/` folder. Right now, we test the core game logic (which is the most important part to get right).

1. **`tests/state/bomb.test.ts`**:
   - Tests `generateSerialNumber()` to ensure it returns the correct format (e.g., `A1B-234`).
   - Tests `generateWireModule()` to guarantee that the puzzle rules priority is always followed correctly depending on whether the serial number ends in an **Odd** or **Even** number.
2. **`tests/state/rooms.test.ts`**:
   - Tests `generateRoomCode()` to ensure it outputs exactly 6 uppercase alphanumeric characters.
   - Tests `generateUniqueRoomCode()` to verify it never generates a room code that already exists in active memory.
3. **`tests/state/gameplay.test.ts`**:
   - Tests the gameplay state sequence: verifying that cutting a wrong wire increments `strikes`, cutting a right wire sets the bomb to `"defused"`, and reaching 3 strikes sets the bomb to `"exploded"`.

---

## 6. Local Testing vs. Deployed Testing
- **Local Testing (What we just did):** Running `npm test` on your own computer. It's the developer's safety net to make sure new code doesn't break old rules.
- **CI (Continuous Integration):** We can configure GitHub so that every time you push code, GitHub automatically runs your local tests on a virtual server. If they fail, GitHub warns you.
- **E2E / Deployed Testing:** Testing the actual live server on Render. This involves writing scripts that send real HTTP requests to your live URL to make sure your database, server, and network are all functioning together.
- **Uptime Monitoring:** A service that pings your live website every 5 minutes to ensure it hasn't crashed.

