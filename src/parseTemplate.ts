/**
 * A simple HTML DOM parser in TypeScript that constructs a tree of elements
 * from a valid HTML string
 */


type AttributeMap = Record<string, string>;

interface HTMLElement {
  tagName: string;
  attributes: AttributeMap;
  children: HTMLElement[];
  text: string;
}

function isAlphanumeric(char: string): boolean {
  return /^[a-zA-Z0-9]$/.test(char);
}

// Helper function to create a new HTML element
function createElement(
  tagName: string,
  attributes: AttributeMap = {},
  children: HTMLElement[] = [],
  text: string = ''
): HTMLElement {
  return {
    tagName,
    attributes,
    children,
    text
  };
}

export function parseTemplate(html: string): HTMLElement | null {
    // Remove comments
    html = html.replace(/<!--[\s\S]*?-->/g, '');
    
    // Stack to hold parent elements during parsing
    const stack: HTMLElement[] = [];
    // Root element to be returned
    let root: HTMLElement | null = null;
    // Current position in the HTML string
    let pos = 0;

    let isStartTag = false;
    let isEndTag = false;
    let isAttrKey = false;
    let isAttrVal = false;

    let currentNode: HTMLElement | null = null;
    let currentKey = '';
    let currentVal = '';
    while (pos < html.length) {
      console.log(stack);

      // Finish tag and either descend to be below the current node or remain parallel
      if((isAttrKey || isStartTag) && html[pos] === '>' || (html[pos] === '/' && (pos < html.length - 1 && html[pos + 1] === '>'))) {
        if(isAttrKey && currentNode) {
          currentNode.attributes[currentKey] = '';
          currentKey = '';
        }
        else if(isStartTag && !currentNode) {
          currentNode = createElement(currentVal);
          isStartTag = false;
          isAttrKey = true;
        }
        isStartTag = false;
        isAttrKey = false;

        if(stack.length && currentNode) {
          stack[stack.length - 1].children.push(currentNode);
        } else if (!stack.length && currentNode) {
          root = currentNode;
        }
        
        if(html[pos] === '>' && currentNode) {
          stack.push(currentNode);
          currentNode = null;
        }
      }

      // Parse Tag
      else if(isStartTag) {
        if(html[pos] === ' ') {
          currentNode = createElement(currentVal);
          currentVal = '';
          isStartTag = false;
          isAttrKey = true;
        }
        else if(isAlphanumeric(html[pos])) {
          currentVal += html[pos];
        }
        else {
          throw new Error('Invalid tag name');
        }
      }

      else if (isEndTag) {
        if(html[pos] === '>') {
          if(stack.length && stack[stack.length - 1].tagName === currentVal) {
            const tmp = stack.pop();
            if(!stack.length && tmp) {
              root = tmp;
            }
          }
          else {
            throw new Error('Invalid closing tag');
          }
          isEndTag = false;
          currentVal = '';
        }
        else if(isAlphanumeric(html[pos])) {
          currentVal += html[pos];
        }
        else {
          throw new Error('Invalid tag name');
        }
      }
    
      // Parse attribute key
      else if(isAttrKey) {
          if(html[pos] === ' ' && currentKey && currentNode) {
            currentNode.attributes[currentKey] = '';
            currentKey = '';
          }
          else if (html[pos] === '=') {
            ++pos;
            if(html[pos] !== '"') throw new Error('Invalid attribute value');
            isAttrKey = false;
            isAttrVal = true;
          }
          else {
            currentKey += html[pos];
          }
        }


      // Parse attribute value
      else if(isAttrVal) {
          if(html[pos] === '"' && currentNode) {
            currentNode.attributes[currentKey] = currentVal;
            currentKey = '';
            currentVal = '';
            isAttrVal = false;
            isAttrKey = true;
          }
          else {
            currentVal += html[pos];
          }
        }

      // Enter modes
      else {
          if(html[pos] === '<' && (pos < html.length - 1 && html[pos + 1] !== '/')) {
            if (stack.length) {
              stack[stack.length - 1].text = currentVal;
              currentVal = '';
            }
            isStartTag = true;
            ++pos; // Skip the '<'
          }
          else if(html[pos] === '<' && (pos < html.length - 1 && html[pos + 1] === '/')) {
            isEndTag = true;
            pos += 2; // Skip the '</'
          }
          else {
            currentVal += html[pos];
          }
        }

      ++pos;
    }
    
    return root;
  }