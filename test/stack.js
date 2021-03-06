var should = require('should');
var stack = require('../lib/stack');

describe('stack', function () {

  describe('top', function () {

    it('should return undefined for an empty stack', function () {
      var s = stack();
      should.not.exist(s.top());
    });

    it('should return pushed item', function () {
      var s = stack(5);

      s.top().should.be.eql(5);

      s.push('abc');
      s.top().should.be.eql('abc');
      s.top(1).should.be.eql(5);

      s.push(/abc/);
      s.top().should.be.eql(/abc/);
      s.top(1).should.be.eql('abc');
      s.top(2).should.be.eql(5);
      should.not.exist(s.top(3));
    });

  });

  describe('push/pop', function() {

    it('pop should return previously pushed item', function () {
      var s = stack();

      s.empty().should.be.true();
      should.not.exist(s.pop());

      s.push('abc');
      s.push('cda');

      s.empty().should.be.false();

      s.pop().should.be.eql('cda');
      s.pop().should.be.eql('abc');

      s.empty().should.be.true();
    });

    it('pop should only return item if pushed tag matches', function () {
      var s = stack();

      s.empty().should.be.true();
      should.not.exist(s.pop());

      s.push('abc', 'T1');
      s.push('cda', 'T2');

      should.not.exist(s.pop());
      should.not.exist(s.pop('T1'));
      should.not.exist(s.pop('xxx'));

      s.pop('T2').should.be.eql('cda');

      should.not.exist(s.pop());
      should.not.exist(s.pop('T2'));

      s.pop('T1').should.be.eql('abc');

      s.empty().should.be.true();
    });


  });

});
