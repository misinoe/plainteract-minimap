import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import common from 'rollup-plugin-commonjs'
// import uglify from 'rollup-plugin-uglify';
// import uglifyEs from 'uglify-es';
import uglifyEs from 'rollup-plugin-uglify-es';

export default {
  input: 'src/main.js',
  output: {
    file: 'lib/plainteract-minimap.js',
    name: 'Minimap',
    format: 'umd',
  },
  plugins: [
    resolve({
      jsnext: true,
    }),
    common(),
    babel({
      exclude: 'node_modules/**',
      runtimeHelpers: true,
      }),
    uglifyEs(),
  ],
};
