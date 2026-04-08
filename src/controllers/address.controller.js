import {
    createAddressService,
    deleteAddressService,
    getAddressByIdService,
    getAllAdressService,
    updateAddressService
} from "../services/addres.service.js";


export async function getAllAdressController(req, res, next) {
    try {
        const address = await getAllAdressService(req.user.id)

        if (address.length === 0) {
            res.status(200).json({ message: "You do not have an address yet" })
        }
        return res.status(200).json({
            message: "Successfull get all address",
            data: address
        })
    } catch (error) {
        next(error)
    }
}

export async function getAddressByIdController(req, res, next) {
    try {
        const address = await getAddressByIdService(req.params.id, req.user.id);
        return res.status(200).json({
            message: "Successfull get address",
            data: address
        });
    } catch (error) {
        next(error)
    }
}

export async function createAddressController(req, res, next) {
    try {
        const result = await createAddressService(req.user.id, req.body)
        res.status(201).json({
            message: "Successfull create address",
            data: result
        })
    } catch (error) {
        next(error)
    }
}

export async function updateAddressController(req, res, next) {
    try {
        const result = await updateAddressService(req.params.id, req.user.id, req.body)
        return res.status(200).json({
            message: "Successfull updated address",
            data: result
        })
    } catch (error) {
        next(error)
    }
}

export async function deleteAdressController(req, res, next) {
    try {
        const result = await deleteAddressService(req.params.id, req.user.id)
        return res.status(200).json({
            message: "Successfull deleted address",
            data: result
        })
    } catch (error) {
        next(error)
    }
}
