const { validarJWT } = require('../middlewares/validar-jwt');
const controller = require('../controllers/lakes_feel');

const {Router} = require('express');
const router = Router();

router.post('/agregarAbonoCliente',controller.agregarAbonoCliente);
router.post('/obtenerPerfilQr',controller.obtenerPerfilQr);

router.post('/generarPulseras',controller.crearPulseras);

//nuevos

router.post('/calcularEntradasVendidas',controller.calcularEntradasVendidas);
router.post('/sincronizarPulsera',controller.sincronizarPulsera);


router.post('/admin',controller.admin);

module.exports = router;