// Utility to parse Vue SFC and extract component structure into JSON

import { parse } from '@vue/compiler-sfc';
import { ScriptSetupAst } from '@vue/compiler-sfc';

/**
 * Interface defining the structure of the Vue component JSON output
 */
interface VueComponentStructure {
  props: Record<string, { type: string; required?: boolean; default?: any }>;
  computed: Record<string, string>;
  methods: Record<string, string>;
  data: Record<string, any>;
  watch: Record<string, string>;
  lifecycleHooks: string[];
}

/**
 * Parses a Vue SFC string and returns its structure as JSON
 * @param sfcContent - The content of the Vue SFC as a string
 * @returns VueComponentStructure - JSON object representing the component structure
 */
export function parseVueSFC(sfcContent: string): VueComponentStructure {
  const { descriptor } = parse(sfcContent);
  const structure: VueComponentStructure = {
    props: {},
    computed: {},
    methods: {},
    data: {},
    watch: {},
    lifecycleHooks: [],
  };

  // Handle script setup if present
  if (descriptor.scriptSetup) {
    processScriptSetup(descriptor.scriptSetup, structure);
  }

  // Handle regular script if present
  if (descriptor.script) {
    processScript(descriptor.script.content, structure);
  }

  return structure;
}

/**
 * Processes script setup content to extract component structure
 * @param scriptSetup - The script setup AST
 * @param structure - The component structure to populate
 */
function processScriptSetup(
  scriptSetup: ScriptSetupAst,
  structure: VueComponentStructure
): void {
  // Extract defineProps
  const definePropsCall = scriptSetup.content.match(
    /defineProps<([^>]+)>\(([^)]+)\)/
  );
  if (definePropsCall) {
    try {
      const propsType = definePropsCall[1];
      const propsConfig = JSON.parse(definePropsCall[2].replace(/'/g, '"'));
      Object.entries(propsConfig).forEach(([propName, config]) => {
        structure.props[propName] = {
          type: typeof config === 'object' ? config.type : 'unknown',
          required: config.required,
          default: config.default,
        };
      });
    } catch (e) {
      console.warn('Error parsing defineProps:', e);
    }
  }

  // Extract computed properties (using ref/reactive)
  const computedMatches = scriptSetup.content.matchAll(
    /const\s+(\w+)\s*=\s*computed\((.*?)\)/gs
  );
  for (const match of computedMatches) {
    structure.computed[match[1]] = match[2].trim();
  }

  // Extract methods
  const methodMatches = scriptSetup.content.matchAll(
    /function\s+(\w+)\s*\((.*?)\)\s*{/gs
  );
  for (const match of methodMatches) {
    structure.methods[match[1]] = `(${match[2]}) => {...}`;
  }
}

/**
 * Processes regular script content to extract component structure
 * @param scriptContent - The script content as a string
 * @param structure - The component structure to populate
 */
function processScript(
  scriptContent: string,
  structure: VueComponentStructure
): void {
  try {
    // Extract export default object
    const exportMatch = scriptContent.match(
      /export\s+default\s+({[\s\S]*?})/
    );
    if (!exportMatch) return;

    const componentObject = eval(`(${exportMatch[1]})`);

    // Process props
    if (componentObject.props) {
      Object.entries(componentObject.props).forEach(([propName, config]) => {
        structure.props[propName] = {
          type: config.type?.name || 'unknown',
          required: config.required,
          default: config.default,
        };
      });
    }

    // Process computed
    if (componentObject.computed) {
      Object.keys(componentObject.computed).forEach((key) => {
        structure.computed[key] = 'computed property';
      });
    }

    // Process methods
    if (componentObject.methods) {
      Object.keys(componentObject.methods).forEach((key) => {
        structure.methods[key] = 'method';
      });
    }

    // Process data
    if (componentObject.data) {
      structure.data = componentObject.data();
    }

    // Process watch
    if (componentObject.watch) {
      Object.keys(componentObject.watch).forEach((key) => {
        structure.watch[key] = 'watcher';
      });
    }

    // Process lifecycle hooks
    const lifecycleHooks = [
      'beforeCreate',
      'created',
      'beforeMount',
      'mounted',
      'beforeUpdate',
      'updated',
      'beforeDestroy',
      'destroyed',
      'activated',
      'deactivated',
    ];
    lifecycleHooks.forEach((hook) => {
      if (componentObject[hook]) {
        structure.lifecycleHooks.push(hook);
      }
    });
  } catch (e) {
    console.warn('Error parsing script content:', e);
  }
}