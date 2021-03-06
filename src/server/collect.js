/* @flow */

import postcss from 'postcss';

type CollectResult = {
  critical: string,
  other: string,
};

const collect = (
  html: string,
  css: string,
  globalCSS?: string
): CollectResult => {
  const animations = new Set();
  const other = postcss.root();
  const critical = postcss.root();
  const stylesheet = postcss.parse(css);
  const htmlClassesRegExp = extractClassesFromHtml(html);

  // Traverse @rules, insert to critical and other and remove
  // the rule from stylesheet
  stylesheet.walkAtRules(rule => {
    let addedToCritical = false;

    rule.each(childRule => {
      if (childRule.selector.match(htmlClassesRegExp)) {
        critical.append(rule.clone());
        addedToCritical = true;
      }
    });

    if (rule.name === 'keyframes') {
      return;
    }

    if (addedToCritical) {
      rule.remove();
    } else {
      other.append(rule);
    }
  });

  stylesheet.walkRules(rule => {
    if (rule.parent.name === 'keyframes') {
      return;
    }

    if (rule.selector.match(htmlClassesRegExp)) {
      critical.append(rule);
    } else {
      other.append(rule);
    }
  });

  critical.walkDecls(/animation/, decl => {
    animations.add(decl.value.split(' ')[0]);
  });

  stylesheet.walkAtRules('keyframes', rule => {
    if (animations.has(rule.params)) {
      critical.append(rule);
    }
  });

  return {
    critical: (globalCSS || '') + critical.toString(),
    other: other.toString(),
  };
};

const extractClassesFromHtml = (html: string): RegExp => {
  const htmlClasses = [];
  const regex = /\s+class="(.*)"/gm;
  let match = regex.exec(html);

  while (match !== null) {
    match[1].split(' ').forEach(className => htmlClasses.push(className));
    match = regex.exec(html);
  }

  return new RegExp(htmlClasses.join('|'), 'gm');
};

export default collect;
