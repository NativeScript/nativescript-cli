import { KinveyError } from './errors';
import isPlainObject from 'lodash/lang/isPlainObject';
import clone from 'lodash/lang/clone';
const privateAclSymbol = Symbol();

class PrivateAcl {
  get creator() {
    return this.acl.creator;
  }

  get readers() {
    return this.acl.r || [];
  }

  get writers() {
    return this.acl.w || [];
  }

  get readerGroups() {
    return this.acl.groups ? this.acl.groups.r : [];
  }

  get writerGroups() {
    return this.acl.groups ? this.acl.groups.w : [];
  }

  set globallyReadable(gr) {
    this.acl.gr = gr || false;
  }

  set globallyWritable(gw) {
    this.acl.gw = gw || false;
  }

  constructor(acl = {}) {
    if (!isPlainObject(acl)) {
      throw new KinveyError('acl argument must be an object');
    }

    this.acl = acl;
  }

  addReader(user) {
    const r = this.acl.r || [];

    if (r.indexOf(user) === -1) {
      r.push(user);
    }

    this.acl.r = r;
    return this;
  }

  addReaderGroup(group) {
    const groups = this.acl.groups || {};
    const w = groups.w || [];

    if (w.indexOf(group) === -1) {
      w.push(group);
    }

    groups.w = w;
    this.acl.groups = groups;
    return this;
  }

  addWriter(user) {
    const w = this.acl.w || [];

    if (w.indexOf(user) === -1) {
      w.push(user);
    }

    this.acl.w = w;
    return this;
  }

  isGloballyReadable() {
    return this.acl.gr || false;
  }

  isGloballyWritable() {
    return this.acl.gw || false;
  }

  removeReader(user) {
    const r = this.acl.r || [];
    const pos = r.indexOf(user);

    if (pos !== -1) {
      r.splice(pos, 1);
    }

    this.acl.r = r;
    return this;
  }

  removeReaderGroup(group) {
    const groups = this.acl.groups || {};
    const r = groups.r || [];
    const pos = r.indexOf(group);

    if (pos !== -1) {
      r.splice(pos, 1);
    }

    groups.r = r;
    this.acl.groups = groups;
    return this;
  }

  removeWriter(user) {
    const w = this.acl.w || [];
    const pos = w.indexOf(user);

    if (pos !== -1) {
      w.splice(pos, 1);
    }

    this.acl.w = w;
    return this;
  }

  removeWriterGroup(group) {
    const groups = this.acl.groups || {};
    const w = groups.w || [];
    const pos = w.indexOf(group);

    if (pos !== -1) {
      w.splice(pos, 1);
    }

    groups.w = w;
    this.acl.groups = groups;
    return this;
  }

  toJSON() {
    return clone(this.acl);
  }
}

export default class Acl {
  get creator() {
    return this[privateAclSymbol].creator;
  }

  get readers() {
    return this[privateAclSymbol].readers;
  }

  get readerGroups() {
    return this[privateAclSymbol].readerGroups;
  }

  get writerGroups() {
    return this[privateAclSymbol].writerGroups;
  }

  get writers() {
    return this[privateAclSymbol].writers;
  }

  set globallyReadable(gr) {
    this[privateAclSymbol].globallyReadable = gr;
  }

  set globallyWritable(gw) {
    this[privateAclSymbol].globallyWritable = gw;
  }

  constructor(acl) {
    this[privateAclSymbol] = new PrivateAcl(acl);
  }

  addReader(user) {
    this[privateAclSymbol].addReader(user);
    return this;
  }

  addReaderGroup(group) {
    this[privateAclSymbol].addReaderGroup(group);
    return this;
  }

  addWriter(user) {
    this[privateAclSymbol].addWriter(user);
    return this;
  }

  isGloballyReadable() {
    return this[privateAclSymbol].isGloballyReadable();
  }

  isGloballyWritable() {
    return this[privateAclSymbol].isGloballyWritable();
  }

  removeReader(user) {
    this[privateAclSymbol].removeReader(user);
    return this;
  }

  removeReaderGroup(group) {
    this[privateAclSymbol].removeReaderGroup(group);
    return this;
  }

  removeWriter(user) {
    this[privateAclSymbol].removeWriter(user);
    return this;
  }

  removeWriterGroup(group) {
    this[privateAclSymbol].removeWriterGroup(group);
    return this;
  }

  toJSON() {
    return this[privateAclSymbol].toJSON();
  }
}
