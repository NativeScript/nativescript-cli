import isPlainObject from 'lodash/isPlainObject';
import KinveyError from './errors/kinvey';

interface Entity {
  _acl?: {
    gr?: boolean,
    gw?: boolean,
    creator?: string,
    r?: string[],
    w?: string[],
    groups?: {
      r?: string[],
      w?: string[]
    }
  }
}

export default class Acl {
  private entity: Entity;

  constructor(entity?: Entity) {
    if (!isPlainObject(entity)) {
      throw new KinveyError('entity must be an object.');
    }

    entity._acl = entity._acl || {}; // eslint-disable-line no-param-reassign
    this.entity = entity;
  }

  get creator() {
    return this.entity._acl.creator;
  }

  get readers() {
    return Array.isArray(this.entity._acl.r) ? this.entity._acl.r : [];
  }

  get writers() {
    return Array.isArray(this.entity._acl.w) ? this.entity._acl.w : [];
  }

  get readerGroups() {
    return this.entity._acl.groups && Array.isArray(this.entity._acl.groups.r) ? this.entity._acl.groups.r : [];
  }

  get writerGroups() {
    return this.entity._acl.groups && Array.isArray(this.entity._acl.groups.w) ? this.entity._acl.groups.w : [];
  }

  set globallyReadable(gr) {
    this.entity._acl.gr = gr === true;
  }

  set globallyWritable(gw) {
    this.entity._acl.gw = gw === true;
  }

  addReader(reader) {
    const r = this.readers;

    if (r.indexOf(reader) === -1) {
      r.push(reader);
    }

    this.entity._acl.r = r;
    return this;
  }

  addReaderGroup(group) {
    const groups = this.readerGroups;

    if (groups.indexOf(group) === -1) {
      groups.push(group);
    }

    this.entity._acl.groups = Object.assign({}, this.entity._acl.groups, { r: groups });
    return this;
  }

  addWriter(writer) {
    const w = this.writers;

    if (w.indexOf(writer) === -1) {
      w.push(writer);
    }

    this.entity._acl.w = w;
    return this;
  }

  addWriterGroup(group) {
    const groups = this.writerGroups;

    if (groups.indexOf(group) === -1) {
      groups.push(group);
    }

    this.entity._acl.groups = Object.assign({}, this.entity._acl.groups, { w: groups });
    return this;
  }

  isGloballyReadable() {
    return this.entity._acl.gr === true;
  }

  isGloballyWritable() {
    return this.entity._acl.gw === true;
  }

  removeReader(reader) {
    const r = this.readers;
    const index = r.indexOf(reader);

    if (index !== -1) {
      r.splice(index, 1);
    }

    this.entity._acl.r = r;
    return this;
  }

  removeReaderGroup(group) {
    const groups = this.readerGroups;
    const index = groups.indexOf(group);

    if (index !== -1) {
      groups.splice(index, 1);
    }

    this.entity._acl.groups = Object.assign({}, this.entity._acl.groups, { r: groups });
    return this;
  }

  removeWriter(writer) {
    const w = this.writers;
    const index = w.indexOf(writer);

    if (index !== -1) {
      w.splice(index, 1);
    }

    this.entity._acl.w = w;
    return this;
  }

  removeWriterGroup(group) {
    const groups = this.writerGroups;
    const index = groups.indexOf(group);

    if (index !== -1) {
      groups.splice(index, 1);
    }

    this.entity._acl.groups = Object.assign({}, this.entity._acl.groups, { w: groups });
    return this;
  }

  toPlainObject() {
    return this.entity._acl;
  }
}
