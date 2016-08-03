var express = require('express');
var router = express.Router();

/* GET teacher's classroom */
router.get('/teacher', function(req, res, next) {
    res.render('teacherClassroom', { title: 'Express' });
});
/* GET teacher's whiteboard. */
router.get('/teacher/whiteboard', function(req, res, next) {
    res.render('teacherWhiteboard', { title: 'Express' });
});
/* GET teacher's video */
router.get('/teacher/video', function(req, res, next) {
    res.render('teacherVideo', { title: 'Express' });
});

module.exports = router;
