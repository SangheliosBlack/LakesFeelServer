    const controller = require('../controllers/direcciones');
const {validarJWT} = require('../middlewares/validar-jwt');
const {Router} = require('express');

const router = Router();

router.get('/',               validarJWT,controller.getDirecciones);

router.post('/predeterminada',validarJWT,controller.direccionPredeterminada);
router.post('/nuevaDireccion',validarJWT,controller.nuevaDireccion);
router.post('/eliminar',      validarJWT,controller.eliminarDireccion);
router.post('/search',        validarJWT,controller.searchOne);

module.exports = router;