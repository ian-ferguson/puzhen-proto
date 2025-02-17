export default {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-standard-scss',
    'stylelint-prettier/recommended',
  ],
  rules: {
    'selector-class-pattern':
      '^\.[a-z]([a-z0-9-]+)?(__([a-z0-9]+-?)+)?(--([a-z0-9]+-?)+){0,2}$',

    'custom-property-pattern':
      '^\.[a-z]([a-z0-9-]+)?(__([a-z0-9]+-?)+)?(--([a-z0-9]+-?)+){0,2}$',
    'selector-no-qualifying-type': true,
  },
};
