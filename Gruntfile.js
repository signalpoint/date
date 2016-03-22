var date_grunt_src = [
  'src/*.*.js'
];

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: { },
      dist: {
        src: date_grunt_src,
        dest: '<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: { },
      build: {
        src: date_grunt_src,
        dest: '<%= pkg.name %>.min.js'
      }
    },
    watch: {
      files: date_grunt_src,
      tasks: ['concat', 'uglify']
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task(s).
  grunt.registerTask('default', ['concat', 'uglify', 'watch']);

};
