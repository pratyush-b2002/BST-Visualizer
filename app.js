/* app.js – Complete BST Visualizer with working functionality */

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

/**
 * BST Node
 */
class BSTNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
    this.parent = null;
    this.x = 0;
    this.y = 0;
  }
}

/**
 * Binary Search Tree
 */
class BST {
  constructor() {
    this.root = null;
  }

  insert(value) {
    if (!this.root) {
      this.root = new BSTNode(value);
      return { inserted: true, node: this.root, parent: null };
    }
    
    let curr = this.root;
    let parent = null;
    
    while (curr) {
      if (value === curr.value) {
        return { inserted: false, node: curr, parent };
      }
      parent = curr;
      curr = value < curr.value ? curr.left : curr.right;
    }
    
    const node = new BSTNode(value);
    node.parent = parent;
    if (value < parent.value) {
      parent.left = node;
    } else {
      parent.right = node;
    }
    
    return { inserted: true, node, parent };
  }

  search(value) {
    const path = [];
    let curr = this.root;
    
    while (curr) {
      path.push(curr);
      if (value === curr.value) {
        return { found: curr, path };
      }
      curr = value < curr.value ? curr.left : curr.right;
    }
    
    return { found: null, path };
  }

  delete(value) {
    const node = this._find(value);
    if (!node) return false;

    if (!node.left && !node.right) {
      // No children
      this._replace(node, null);
    } else if (!node.left) {
      // Only right child
      this._replace(node, node.right);
    } else if (!node.right) {
      // Only left child
      this._replace(node, node.left);
    } else {
      // Two children - find successor
      let succ = node.right;
      while (succ.left) succ = succ.left;
      const succVal = succ.value;
      this.delete(succVal);
      node.value = succVal;
      return true;
    }
    return true;
  }

  inorder() {
    const result = [];
    this._inorderHelper(this.root, result);
    return result;
  }

  preorder() {
    const result = [];
    this._preorderHelper(this.root, result);
    return result;
  }

  postorder() {
    const result = [];
    this._postorderHelper(this.root, result);
    return result;
  }

  _inorderHelper(node, result) {
    if (node) {
      this._inorderHelper(node.left, result);
      result.push(node.value);
      this._inorderHelper(node.right, result);
    }
  }

  _preorderHelper(node, result) {
    if (node) {
      result.push(node.value);
      this._preorderHelper(node.left, result);
      this._preorderHelper(node.right, result);
    }
  }

  _postorderHelper(node, result) {
    if (node) {
      this._postorderHelper(node.left, result);
      this._postorderHelper(node.right, result);
      result.push(node.value);
    }
  }

  _find(value) {
    let curr = this.root;
    while (curr && curr.value !== value) {
      curr = value < curr.value ? curr.left : curr.right;
    }
    return curr;
  }

  _replace(node, replacement) {
    if (!node.parent) {
      this.root = replacement;
    } else if (node === node.parent.left) {
      node.parent.left = replacement;
    } else {
      node.parent.right = replacement;
    }
    if (replacement) {
      replacement.parent = node.parent;
    }
  }
}

/**
 * BST Visualizer
 */
class BSTVisualizer {
  constructor(svgElement) {
    this.svg = svgElement;
    this.tree = new BST();
    this.duration = 250;
  }

  loadSample() {
    [50, 30, 70, 20, 40, 60, 80].forEach(val => this.tree.insert(val));
    this._layoutAndRender();
  }

  insert(value) {
    const result = this.tree.insert(value);
    if (!result.inserted) {
      showToast('Duplicate value – ignored');
      return;
    }
    
    this._layoutAndRender();
    
    // Animation: new node starts at parent position
    const newNode = result.node;
    const nodeGroup = $(`#node-${newNode.value}`);
    if (nodeGroup && result.parent) {
      const startX = result.parent.x;
      const startY = result.parent.y;
      nodeGroup.setAttribute('transform', `translate(${startX}, ${startY})`);
      nodeGroup.style.opacity = '0';
      
      requestAnimationFrame(() => {
        nodeGroup.style.opacity = '1';
        nodeGroup.setAttribute('transform', `translate(${newNode.x}, ${newNode.y})`);
      });
    }
  }

  delete(value) {
    const target = this.tree._find(value);
    if (!target) {
      showToast('Value not found');
      return;
    }

    const nodeGroup = $(`#node-${value}`);
    if (nodeGroup) {
      nodeGroup.classList.add('deleting');
      
      setTimeout(() => {
        this.tree.delete(value);
        this._layoutAndRender();
      }, this.duration);
    } else {
      this.tree.delete(value);
      this._layoutAndRender();
    }
  }

  search(value) {
    const { found, path } = this.tree.search(value);
    
    // Clear previous highlights
    $$('.node').forEach(node => {
      node.classList.remove('search-path', 'found');
    });

    // Highlight path sequentially
    path.forEach((node, index) => {
      setTimeout(() => {
        const nodeGroup = $(`#node-${node.value}`);
        if (nodeGroup) {
          nodeGroup.classList.add('search-path');
        }
      }, index * this.duration);
    });

    // Final result
    setTimeout(() => {
      if (found) {
        const foundGroup = $(`#node-${found.value}`);
        if (foundGroup) {
          foundGroup.classList.remove('search-path');
          foundGroup.classList.add('found');
        }
      } else {
        showToast('Value not found');
      }
    }, path.length * this.duration);
  }

  traversal(type) {
    let sequence = [];
    if (type === 'in') sequence = this.tree.inorder();
    else if (type === 'pre') sequence = this.tree.preorder();
    else if (type === 'post') sequence = this.tree.postorder();

    const output = $('#traversal-output');
    output.innerHTML = '';
    
    sequence.forEach((value, index) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = value;
      output.appendChild(chip);
      
      setTimeout(() => {
        chip.classList.add('show');
      }, index * 60);
    });
  }

  _layoutAndRender() {
    this._computeLayout();
    this._renderTree();
  }

  _computeLayout() {
    let xCounter = 0;
    const levelHeights = {};
    
    const inOrderTraversal = (node, depth = 0) => {
      if (!node) return;
      
      inOrderTraversal(node.left, depth + 1);
      node.x = xCounter * 70 + 60;
      node.y = depth * 90 + 60;
      xCounter++;
      inOrderTraversal(node.right, depth + 1);
      
      levelHeights[depth] = Math.max(levelHeights[depth] || 0, node.x);
    };
    
    inOrderTraversal(this.tree.root);
    
    // Update SVG viewBox
    const maxWidth = Math.max(300, Math.max(...Object.values(levelHeights)) + 80);
    const maxHeight = (Object.keys(levelHeights).length + 1) * 90 + 60;
    this.svg.setAttribute('viewBox', `0 0 ${maxWidth} ${maxHeight}`);
  }

  _renderTree() {
    // Clear existing elements
    this.svg.innerHTML = '';
    
    // Draw all nodes and links
    this._traverse(this.tree.root, (node) => {
      if (node.parent) {
        this._drawLink(node.parent, node);
      }
      this._drawNode(node);
    });
  }

  _traverse(node, callback) {
    if (!node) return;
    this._traverse(node.left, callback);
    this._traverse(node.right, callback);
    callback(node);
  }

  _drawNode(node) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('id', `node-${node.value}`);
    group.classList.add('node');
    group.setAttribute('transform', `translate(${node.x}, ${node.y})`);

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', 22);
    circle.setAttribute('cx', 0);
    circle.setAttribute('cy', 0);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', 0);
    text.setAttribute('y', 0);
    text.setAttribute('dy', '.35em');
    text.textContent = node.value;

    group.appendChild(circle);
    group.appendChild(text);
    this.svg.appendChild(group);
  }

  _drawLink(parent, child) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('id', `link-${parent.value}-${child.value}`);
    line.classList.add('link');
    line.setAttribute('x1', parent.x);
    line.setAttribute('y1', parent.y);
    line.setAttribute('x2', child.x);
    line.setAttribute('y2', child.y);
    
    // Insert links before nodes (so they appear behind)
    this.svg.insertBefore(line, this.svg.firstChild);
  }
}

/**
 * Initialize application
 */
document.addEventListener('DOMContentLoaded', () => {
  const svg = $('#tree-svg');
  const visualizer = new BSTVisualizer(svg);
  
  // Load sample tree
  visualizer.loadSample();

  const input = $('#value-input');
  
  const getInputValue = () => {
    const value = parseInt(input.value, 10);
    if (isNaN(value)) {
      showToast('Please enter a valid number');
      return null;
    }
    if (value < -10000 || value > 10000) {
      showToast('Value out of range (±10,000)');
      return null;
    }
    return value;
  };

  // Event listeners
  $('#insert-btn').addEventListener('click', () => {
    const value = getInputValue();
    if (value !== null) {
      visualizer.insert(value);
      input.value = '';
    }
  });

  $('#delete-btn').addEventListener('click', () => {
    const value = getInputValue();
    if (value !== null) {
      visualizer.delete(value);
      input.value = '';
    }
  });

  $('#search-btn').addEventListener('click', () => {
    const value = getInputValue();
    if (value !== null) {
      visualizer.search(value);
    }
  });

  $('#inorder-btn').addEventListener('click', () => {
    visualizer.traversal('in');
  });

  $('#preorder-btn').addEventListener('click', () => {
    visualizer.traversal('pre');
  });

  $('#postorder-btn').addEventListener('click', () => {
    visualizer.traversal('post');
  });

  // Enter key support
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      $('#insert-btn').click();
    }
  });
});