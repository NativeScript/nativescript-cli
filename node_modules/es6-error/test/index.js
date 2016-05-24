import { expect } from 'chai';
import ExtendableError from '../src/index';

class TestError extends ExtendableError {}
class SubTestError extends TestError {}

describe('ExtendableError', () => {
  it('instance of', () => {
    let err = new ExtendableError();
    expect(err).to.be.an.instanceof(Error);
    expect(err).to.be.an.instanceof(ExtendableError);

    let err2 = new TestError();
    expect(err2).to.be.an.instanceof(Error);
    expect(err2).to.be.an.instanceof(ExtendableError);
    expect(err2).to.be.an.instanceof(TestError);

    let err3 = new SubTestError();
    expect(err3).to.be.an.instanceof(Error);
    expect(err3).to.be.an.instanceof(ExtendableError);
    expect(err3).to.be.an.instanceof(TestError);
    expect(err3).to.be.an.instanceof(SubTestError);
  });

  it('.name', () => {
    let err = new ExtendableError();
    expect(err.name).to.equal('ExtendableError');

    let err2 = new TestError();
    expect(err2.name).to.equal('TestError');

    let err3 = new SubTestError();
    expect(err3.name).to.equal('SubTestError');
  });

  it('name is not enumerable', () => {
    let err = new ExtendableError();
    expect(err.propertyIsEnumerable('name')).to.be.false;
  });

  it('.stack', () => {
    let err = new ExtendableError();
    expect(err.stack).to.be.a('string');

    let err2 = new TestError();
    expect(err2.stack).to.be.a('string');
  });

  it('#toString', () => {
    let err = new ExtendableError();
    expect(err.toString()).to.equal('ExtendableError');

    let err2 = new TestError();
    expect(err2.toString()).to.equal('TestError');

    let err3 = new SubTestError();
    expect(err3.toString()).to.equal('SubTestError');
  });

  it('.message', () => {
    let err = new ExtendableError('error occurred');
    expect(err.message).to.equal('error occurred');
  })
});
