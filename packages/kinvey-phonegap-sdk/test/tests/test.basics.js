runner.run(testFunc);

function testFunc() {
    describe.skip('test', () => it('test'));
}
