const levels = [];
const c0 = String.fromCharCode(9500);
const c1 = String.fromCharCode(9472);
const c2 = String.fromCharCode(9492);
const c3 = String.fromCharCode(9474);

function compose(node, end) {
  if (node.level === 0) {
    return node.value;
  }

  let ret = '\r\n';
  const c = end ? c2 : c0;

  for (let i = 1; i < node.level; i++) {
    ret = `${ret}${levels[i] ? ' ' : c3}`;
    ret = `${ret}  `;
  }

  return `${ret}${c}${c1} ${node.value}`;
}

/**
 * @private
 */
export const AsciiTree = {
  generate(tree = {}, end) {
    let result = compose(tree, end);

    if (tree.nodes.length > 0) {
      const last = tree.nodes.length - 1;
      tree.nodes.forEach((subTree, index) => {
        levels[subTree.level] = index === last;
        result = result + this.generate(subTree, index === last);
      });
    }

    return result;
  }
};
