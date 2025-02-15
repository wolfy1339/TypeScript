import * as evaluator from "../../_namespaces/evaluator.js";
import * as ts from "../../_namespaces/ts.js";

function FakeSuppressedError(error: any, suppressed: any) {
    return { error, suppressed };
}

describe("unittests:: evaluation:: awaitUsingDeclarations", () => {
    it("'await using' in Block, normal completion (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        const disposable = {
            async [Symbol.asyncDispose]() {
                output.push("disposed");
            }
        };

        function body() {
            output.push("body");
        }

        export async function main() {
            output.push("before block");
            {
                output.push("enter block");
                await using _ = disposable;
                body();
                output.push("exit block");
            }
            output.push("after block");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before block",
            "enter block",
            "body",
            "exit block",
            "disposed",
            "after block",
        ]);
    });

    it("'await using' in Block, 'throw' in body (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        const disposable = {
            async [Symbol.asyncDispose]() {
                output.push("disposed");
            }
        };

        function body() {
            output.push("body");
            throw "error";
        }

        export async function main() {
            output.push("before try");
            try {
                output.push("enter try");
                await using _ = disposable;
                body();
                output.push("exit try");
            }
            catch (e) {
                output.push(e);
            }
            output.push("after try");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before try",
            "enter try",
            "body",
            "disposed",
            "error",
            "after try",
        ]);
    });

    it("'await using' in Block, 'throw' in dispose (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        const disposable = {
            async [Symbol.asyncDispose]() {
                output.push("disposed");
                throw "error";
            }
        };

        function body() {
            output.push("body");
        }

        export async function main() {
            output.push("before try");
            try {
                output.push("enter try");
                await using _ = disposable;
                body();
                output.push("exit try");
            }
            catch (e) {
                output.push(e);
            }
            output.push("after try");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before try",
            "enter try",
            "body",
            "exit try",
            "disposed",
            "error",
            "after try",
        ]);
    });

    it("'await using' in Block, 'throw' in body and dispose (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        const disposable = {
            async [Symbol.asyncDispose]() {
                output.push("disposed");
                throw "dispose error";
            }
        };

        function body() {
            output.push("body");
            throw "body error";
        }

        export async function main() {
            output.push("before try");
            try {
                output.push("enter try");
                await using _ = disposable;
                body();
                output.push("exit try");
            }
            catch (e) {
                output.push(e);
            }
            output.push("after try");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
            { SuppressedError: FakeSuppressedError },
        );

        await main();

        assert.deepEqual(output, [
            "before try",
            "enter try",
            "body",
            "disposed",
            {
                error: "dispose error",
                suppressed: "body error",
            },
            "after try",
        ]);
    });

    it("'await using' in Block, 'throw' in body and dispose, no global SuppressedError (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        const disposable = {
            async [Symbol.asyncDispose]() {
                output.push("disposed");
                throw "dispose error";
            }
        };

        function body() {
            output.push("body");
            throw "body error";
        }

        export async function main() {
            output.push("before try");
            try {
                output.push("enter try");
                await using _ = disposable;
                body();
                output.push("exit try");
            }
            catch (e) {
                output.push(e);
            }
            output.push("after try");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output.slice(0, 4), [
            "before try",
            "enter try",
            "body",
            "disposed",
        ]);
        assert.instanceOf(output[4], Error);
        assert.strictEqual(output[4].name, "SuppressedError");
        assert.strictEqual(output[4].error, "dispose error");
        assert.strictEqual(output[4].suppressed, "body error");
        assert.deepEqual(output.slice(5), [
            "after try",
        ]);
    });

    it("'await using' in Block, 'return' in body (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        const disposable = {
            async [Symbol.asyncDispose]() {
                output.push("disposed");
            }
        };

        function body() {
            output.push("body");
        }

        export async function main() {
            output.push("before block");
            {
                output.push("enter block");
                await using _ = disposable;
                body();
                return;
            }
            output.push("after block");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before block",
            "enter block",
            "body",
            "disposed",
        ]);
    });

    it("'await using' in Block, 'break' in body (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        const disposable = {
            async [Symbol.asyncDispose]() {
                output.push("disposed");
            }
        };

        function body() {
            output.push("body");
        }

        export async function main() {
            output.push("before block");
            for (let i = 0; i < 2; i++) {
                output.push("enter block");
                await using _ = disposable;
                body();
                break;
            }
            output.push("after block");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before block",
            "enter block",
            "body",
            "disposed",
            "after block",
        ]);
    });

    it("'await using' in Block, 'continue' in body (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        const disposable = {
            async [Symbol.asyncDispose]() {
                output.push("disposed");
            }
        };

        function body() {
            output.push("body");
        }

        export async function main() {
            output.push("before block");
            for (let i = 0; i < 2; i++) {
                output.push("enter block");
                await using _ = disposable;
                body();
                continue;
            }
            output.push("after block");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before block",
            "enter block",
            "body",
            "disposed",
            "enter block",
            "body",
            "disposed",
            "after block",
        ]);
    });

    it("'await using' in head of 'for', normal completion (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        const disposable = {
            async [Symbol.asyncDispose]() {
                output.push("disposed");
            }
        };

        function body() {
            output.push("body");
        }

        export async function main() {
            output.push("before loop");
            let i = 0;
            for (await using _ = disposable; i < 2; i++) {
                output.push("enter loop");
                body();
                output.push("exit loop");
            }
            output.push("after loop");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before loop",
            "enter loop",
            "body",
            "exit loop",
            "enter loop",
            "body",
            "exit loop",
            "disposed",
            "after loop",
        ]);
    });

    it("'await using' in head of 'for', 'throw' in body (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        const disposable = {
            async [Symbol.asyncDispose]() {
                output.push("disposed");
            }
        };

        function body() {
            output.push("body");
            throw "error";
        }

        export async function main() {
            output.push("before loop");
            let i = 0;
            try {
                for (await using _ = disposable; i < 2; i++) {
                    output.push("enter loop");
                    body();
                    output.push("exit loop");
                }
            } catch (e) {
                output.push(e);
            }
            output.push("after loop");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before loop",
            "enter loop",
            "body",
            "disposed",
            "error",
            "after loop",
        ]);
    });

    it("'await using' in head of 'for', 'throw' in dispose (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        const disposable = {
            async [Symbol.asyncDispose]() {
                output.push("disposed");
                throw "error";
            }
        };

        function body() {
            output.push("body");
        }

        export async function main() {
            output.push("before loop");
            let i = 0;
            try {
                for (await using _ = disposable; i < 2; i++) {
                    output.push("enter loop");
                    body();
                    output.push("exit loop");
                }
            } catch (e) {
                output.push(e);
            }
            output.push("after loop");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before loop",
            "enter loop",
            "body",
            "exit loop",
            "enter loop",
            "body",
            "exit loop",
            "disposed",
            "error",
            "after loop",
        ]);
    });

    it("'await using' in head of 'for', 'throw' in body and dispose (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        const disposable = {
            async [Symbol.asyncDispose]() {
                output.push("disposed");
                throw "dispose error";
            }
        };

        function body() {
            output.push("body");
            throw "body error";
        }

        export async function main() {
            output.push("before loop");
            let i = 0;
            try {
                for (await using _ = disposable; i < 2; i++) {
                    output.push("enter loop");
                    body();
                    output.push("exit loop");
                }
            } catch (e) {
                output.push(e);
            }
            output.push("after loop");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
            { SuppressedError: FakeSuppressedError },
        );

        await main();

        assert.deepEqual(output, [
            "before loop",
            "enter loop",
            "body",
            "disposed",
            {
                error: "dispose error",
                suppressed: "body error",
            },
            "after loop",
        ]);
    });

    it("'await using' in head of 'for', 'return' in body (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        const disposable = {
            async [Symbol.asyncDispose]() {
                output.push("disposed");
            }
        };

        function body() {
            output.push("body");
        }

        export async function main() {
            output.push("before loop");
            let i = 0;
            for (await using _ = disposable; i < 2; i++) {
                output.push("enter loop");
                body();
                return;
            }
            output.push("after loop");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before loop",
            "enter loop",
            "body",
            "disposed",
        ]);
    });

    it("'await using' in head of 'for', 'break' in body (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        const disposable = {
            async [Symbol.asyncDispose]() {
                output.push("disposed");
            }
        };

        function body() {
            output.push("body");
        }

        export async function main() {
            output.push("before loop");
            let i = 0;
            for (await using _ = disposable; i < 2; i++) {
                output.push("enter loop");
                body();
                break;
            }
            output.push("after loop");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before loop",
            "enter loop",
            "body",
            "disposed",
            "after loop",
        ]);
    });

    it("'await using' in head of 'for', 'continue' in body (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        const disposable = {
            async [Symbol.asyncDispose]() {
                output.push("disposed");
            }
        };

        function body() {
            output.push("body");
        }

        export async function main() {
            output.push("before loop");
            let i = 0;
            for (await using _ = disposable; i < 2; i++) {
                output.push("enter loop");
                body();
                continue;
            }
            output.push("after loop");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before loop",
            "enter loop",
            "body",
            "enter loop",
            "body",
            "disposed",
            "after loop",
        ]);
    });

    it("'await using' in head of 'for', multiple iterations (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        const disposable = {
            async [Symbol.asyncDispose]() {
                output.push("disposed");
            }
        };

        function body() {
            output.push("body");
        }

        export async function main() {
            output.push("before loop");
            let i = 0;
            for (await using _ = disposable; i < 2; i++) {
                output.push("enter loop");
                body();
                output.push("exit loop");
            }
            output.push("after loop");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before loop",
            "enter loop",
            "body",
            "exit loop",
            "enter loop",
            "body",
            "exit loop",
            "disposed",
            "after loop",
        ]);
    });

    it("'await using' in head of 'for-of', normal completion (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        function* g() {
            yield {
                async [Symbol.asyncDispose]() {
                    output.push("a disposed");
                }
            };
            yield {
                async [Symbol.asyncDispose]() {
                    output.push("b disposed");
                }
            };
        }

        function body() {
            output.push("body");
        }

        export async function main() {
            output.push("before loop");
            for (await using _ of g()) {
                output.push("enter loop");
                body();
                output.push("exit loop");
            }
            output.push("after loop");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before loop",
            "enter loop",
            "body",
            "exit loop",
            "a disposed",
            "enter loop",
            "body",
            "exit loop",
            "b disposed",
            "after loop",
        ]);
    });

    it("'await using' in head of 'for-of', 'throw' in body (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        function* g() {
            yield {
                async [Symbol.asyncDispose]() {
                    output.push("a disposed");
                }
            };
            yield {
                async [Symbol.asyncDispose]() {
                    output.push("b disposed");
                }
            };
        }

        function body() {
            output.push("body");
            throw "error";
        }

        export async function main() {
            output.push("before loop");
            try {
                for (await using _ of g()) {
                    output.push("enter loop");
                    body();
                    output.push("exit loop");
                }
            }
            catch (e) {
                output.push(e);
            }
            output.push("after loop");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before loop",
            "enter loop",
            "body",
            "a disposed",
            "error",
            "after loop",
        ]);
    });

    it("'await using' in head of 'for-of', 'throw' in dispose (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        function* g() {
            yield {
                async [Symbol.asyncDispose]() {
                    output.push("a disposed");
                    throw "error";
                }
            };
            yield {
                async [Symbol.asyncDispose]() {
                    output.push("b disposed");
                }
            };
        }

        function body() {
            output.push("body");
        }

        export async function main() {
            output.push("before loop");
            try {
                for (await using _ of g()) {
                    output.push("enter loop");
                    body();
                    output.push("exit loop");
                }
            }
            catch (e) {
                output.push(e);
            }
            output.push("after loop");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before loop",
            "enter loop",
            "body",
            "exit loop",
            "a disposed",
            "error",
            "after loop",
        ]);
    });

    it("'await using' in head of 'for-of', 'throw' in body and dispose (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        function* g() {
            yield {
                async [Symbol.asyncDispose]() {
                    output.push("a disposed");
                    throw "dispose error";
                }
            };
            yield {
                async [Symbol.asyncDispose]() {
                    output.push("b disposed");
                }
            };
        }

        function body() {
            output.push("body");
            throw "body error";
        }

        export async function main() {
            output.push("before loop");
            try {
                for (await using _ of g()) {
                    output.push("enter loop");
                    body();
                    output.push("exit loop");
                }
            }
            catch (e) {
                output.push(e);
            }
            output.push("after loop");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
            { SuppressedError: FakeSuppressedError },
        );

        await main();

        assert.deepEqual(output, [
            "before loop",
            "enter loop",
            "body",
            "a disposed",
            {
                error: "dispose error",
                suppressed: "body error",
            },
            "after loop",
        ]);
    });

    it("'await using' in head of 'for-of', 'return' in body (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        function* g() {
            yield {
                async [Symbol.asyncDispose]() {
                    output.push("a disposed");
                }
            };
            yield {
                async [Symbol.asyncDispose]() {
                    output.push("b disposed");
                }
            };
        }

        function body() {
            output.push("body");
        }

        export async function main() {
            output.push("before loop");
            for (await using _ of g()) {
                output.push("enter loop");
                body();
                return;
            }
            output.push("after loop");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before loop",
            "enter loop",
            "body",
            "a disposed",
        ]);
    });

    it("'await using' in head of 'for-of', 'break' in body (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        function* g() {
            yield {
                async [Symbol.asyncDispose]() {
                    output.push("a disposed");
                }
            };
            yield {
                async [Symbol.asyncDispose]() {
                    output.push("b disposed");
                }
            };
        }

        function body() {
            output.push("body");
        }

        export async function main() {
            output.push("before loop");
            for (await using _ of g()) {
                output.push("enter loop");
                body();
                break;
            }
            output.push("after loop");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before loop",
            "enter loop",
            "body",
            "a disposed",
            "after loop",
        ]);
    });

    it("'await using' in head of 'for-of', 'continue' in body (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        function* g() {
            yield {
                async [Symbol.asyncDispose]() {
                    output.push("a disposed");
                }
            };
            yield {
                async [Symbol.asyncDispose]() {
                    output.push("b disposed");
                }
            };
        }

        function body() {
            output.push("body");
        }

        export async function main() {
            output.push("before loop");
            for (await using _ of g()) {
                output.push("enter loop");
                body();
                continue;
            }
            output.push("after loop");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before loop",
            "enter loop",
            "body",
            "a disposed",
            "enter loop",
            "body",
            "b disposed",
            "after loop",
        ]);
    });

    it("'await using' in head of 'for-await-of', normal completion (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        function* g() {
            yield {
                async [Symbol.asyncDispose]() {
                    output.push("a disposed");
                }
            };
            yield {
                async [Symbol.asyncDispose]() {
                    output.push("b disposed");
                }
            };
        }

        function body() {
            output.push("body");
        }

        export async function main() {
            output.push("before loop");
            for await (await using _ of g()) {
                output.push("enter loop");
                body();
                output.push("exit loop");
            }
            output.push("after loop");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before loop",
            "enter loop",
            "body",
            "exit loop",
            "a disposed",
            "enter loop",
            "body",
            "exit loop",
            "b disposed",
            "after loop",
        ]);
    });

    it("'await using' in head of 'for-await-of', 'throw' in body (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        function* g() {
            yield {
                async [Symbol.asyncDispose]() {
                    output.push("a disposed");
                }
            };
            yield {
                async [Symbol.asyncDispose]() {
                    output.push("b disposed");
                }
            };
        }

        function body() {
            output.push("body");
            throw "error";
        }

        export async function main() {
            output.push("before loop");
            try {
                for await (await using _ of g()) {
                    output.push("enter loop");
                    body();
                    output.push("exit loop");
                }
            }
            catch (e) {
                output.push(e);
            }
            output.push("after loop");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before loop",
            "enter loop",
            "body",
            "a disposed",
            "error",
            "after loop",
        ]);
    });

    it("'await using' in head of 'for-await-of', 'throw' in dispose (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        function* g() {
            yield {
                async [Symbol.asyncDispose]() {
                    output.push("a disposed");
                    throw "error";
                }
            };
            yield {
                async [Symbol.asyncDispose]() {
                    output.push("b disposed");
                }
            };
        }

        function body() {
            output.push("body");
        }

        export async function main() {
            output.push("before loop");
            try {
                for await (await using _ of g()) {
                    output.push("enter loop");
                    body();
                    output.push("exit loop");
                }
            }
            catch (e) {
                output.push(e);
            }
            output.push("after loop");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before loop",
            "enter loop",
            "body",
            "exit loop",
            "a disposed",
            "error",
            "after loop",
        ]);
    });

    it("'await using' in head of 'for-await-of', 'throw' in body and dispose (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        function* g() {
            yield {
                async [Symbol.asyncDispose]() {
                    output.push("a disposed");
                    throw "dispose error";
                }
            };
            yield {
                async [Symbol.asyncDispose]() {
                    output.push("b disposed");
                }
            };
        }

        function body() {
            output.push("body");
            throw "body error";
        }

        export async function main() {
            output.push("before loop");
            try {
                for await (await using _ of g()) {
                    output.push("enter loop");
                    body();
                    output.push("exit loop");
                }
            }
            catch (e) {
                output.push(e);
            }
            output.push("after loop");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
            { SuppressedError: FakeSuppressedError },
        );

        await main();

        assert.deepEqual(output, [
            "before loop",
            "enter loop",
            "body",
            "a disposed",
            {
                error: "dispose error",
                suppressed: "body error",
            },
            "after loop",
        ]);
    });

    it("'await using' in head of 'for-await-of', 'return' in body (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        function* g() {
            yield {
                async [Symbol.asyncDispose]() {
                    output.push("a disposed");
                }
            };
            yield {
                async [Symbol.asyncDispose]() {
                    output.push("b disposed");
                }
            };
        }

        function body() {
            output.push("body");
        }

        export async function main() {
            output.push("before loop");
            for await (await using _ of g()) {
                output.push("enter loop");
                body();
                return;
            }
            output.push("after loop");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before loop",
            "enter loop",
            "body",
            "a disposed",
        ]);
    });

    it("'await using' in head of 'for-await-of', 'break' in body (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        function* g() {
            yield {
                async [Symbol.asyncDispose]() {
                    output.push("a disposed");
                }
            };
            yield {
                async [Symbol.asyncDispose]() {
                    output.push("b disposed");
                }
            };
        }

        function body() {
            output.push("body");
        }

        export async function main() {
            output.push("before loop");
            for await (await using _ of g()) {
                output.push("enter loop");
                body();
                break;
            }
            output.push("after loop");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before loop",
            "enter loop",
            "body",
            "a disposed",
            "after loop",
        ]);
    });

    it("'await using' in head of 'for-await-of', 'continue' in body (es2018)", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        function* g() {
            yield {
                async [Symbol.asyncDispose]() {
                    output.push("a disposed");
                }
            };
            yield {
                async [Symbol.asyncDispose]() {
                    output.push("b disposed");
                }
            };
        }

        function body() {
            output.push("body");
        }

        export async function main() {
            output.push("before loop");
            for await (await using _ of g()) {
                output.push("enter loop");
                body();
                continue;
            }
            output.push("after loop");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before loop",
            "enter loop",
            "body",
            "a disposed",
            "enter loop",
            "body",
            "b disposed",
            "after loop",
        ]);
    });

    it("'await using' at top level of module (System)", async () => {
        const { output, x, y } = await evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];
        output.push("before export x");
        export const x = 1;
        output.push("before using");
        await using _ = {
            async [Symbol.asyncDispose]() {
                output.push("disposed");
            }
        };
        output.push("after using");
        export const y = 2;
        output.push("after export y");
        `,
            { target: ts.ScriptTarget.ES2018, module: ts.ModuleKind.System },
        );

        assert.strictEqual(x, 1);
        assert.strictEqual(y, 2);
        assert.deepEqual(output, [
            "before export x",
            "before using",
            "after using",
            "after export y",
            "disposed",
        ]);
    });

    it("'await using' for 'null' value", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        function body() {
            output.push("body");
        }

        export async function main() {
            output.push("before block");
            {
                output.push("enter block");
                await using _ = null;
                body();
                output.push("exit block");
            }
            output.push("after block");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before block",
            "enter block",
            "body",
            "exit block",
            "after block",
        ]);
    });

    it("'await using' for 'undefined' value", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        function body() {
            output.push("body");
        }

        export async function main() {
            output.push("before block");
            {
                output.push("enter block");
                await using _ = undefined;
                body();
                output.push("exit block");
            }
            output.push("after block");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before block",
            "enter block",
            "body",
            "exit block",
            "after block",
        ]);
    });

    it("'await using' for sync disposable value", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        const disposable = {
            [Symbol.dispose]() {
                output.push("disposed");
            }
        };

        function body() {
            output.push("body");
        }

        export async function main() {
            output.push("before block");
            {
                output.push("enter block");
                await using _ = disposable;
                body();
                output.push("exit block");
            }
            output.push("after block");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before block",
            "enter block",
            "body",
            "exit block",
            "disposed",
            "after block",
        ]);
    });

    it("'await using' for non-disposable value", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        function body() {
            output.push("body");
        }

        export async function main() {
            output.push("before block");
            {
                output.push("enter block");
                await using _ = {} as any;
                body();
                output.push("exit block");
            }
            output.push("after block");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        try {
            await main();
            assert.fail("Expected 'main' to throw an error");
        }
        catch {
            // ignore
        }

        assert.deepEqual(output, [
            "before block",
            "enter block",
        ]);
    });

    it("'await using' disposes in reverse order", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        const disposable_1 = {
            async [Symbol.asyncDispose]() {
                output.push("disposed_1");
            }
        };
        const disposable_2 = {
            async [Symbol.asyncDispose]() {
                output.push("disposed_2");
            }
        };

        function body() {
            output.push("body");
        }

        export async function main() {
            output.push("before block");
            {
                output.push("enter block");
                await using _1 = disposable_1, _2 = disposable_2;
                body();
                output.push("exit block");
            }
            output.push("after block");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before block",
            "enter block",
            "body",
            "exit block",
            "disposed_2",
            "disposed_1",
            "after block",
        ]);
    });

    it("'await using' + 'using' disposes in reverse order", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        const disposable_1 = {
            async [Symbol.asyncDispose]() {
                output.push("disposed_1");
            }
        };

        const disposable_2 = {
            [Symbol.dispose]() {
                output.push("disposed_2");
            }
        };

        function body() {
            output.push("body");
        }

        export async function main() {
            output.push("before block");
            {
                output.push("enter block");
                await using _1 = disposable_1;
                using _2 = disposable_2;
                body();
                output.push("exit block");
            }
            output.push("after block");
        }
        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before block",
            "enter block",
            "body",
            "exit block",
            "disposed_2",
            "disposed_1",
            "after block",
        ]);
    });

    it("'await using' forces await if null and evaluated", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        function body() {
            output.push("body");
        }

        async function a() {
            output.push("before block");
            {
                output.push("enter block");
                await using _ = null;
                body();
                output.push("exit block");
            }
            output.push("after block");
        }

        function b() {
            output.push("interleave");
        }

        export async function main() {
            const p = a();
            b();
            await p;
        }

        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before block",
            "enter block",
            "body",
            "exit block",
            "interleave",
            "after block",
        ]);
    });

    it("'await using' does not force await if null and not evaluated", async () => {
        const { main, output } = evaluator.evaluateTypeScript(
            `
        export const output: any[] = [];

        function body() {
            output.push("body");
        }

        async function a(exitEarly: boolean) {
            output.push("before block");
            block: {
                output.push("enter block");
                if (exitEarly) break block;
                await using _ = null;
                body();
                output.push("exit block");
            }
            output.push("after block");
        }

        function b() {
            output.push("no interleave");
        }

        export async function main() {
            const p = a(true);
            b();
            await p;
        }

        `,
            { target: ts.ScriptTarget.ES2018 },
        );

        await main();

        assert.deepEqual(output, [
            "before block",
            "enter block",
            "after block",
            "no interleave",
        ]);
    });
});
