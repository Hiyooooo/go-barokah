import {
    createAddressService,
    deleteAddressService,
    getAddressByIdService,
    getAllAdressService,
    updateAddressService
} from "../services/addres.service.js";

function isValidPhone(phone) {
    const regex = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
    return regex.test(phone);
}

function normalizeBoolean(value) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "true") return true;
        if (normalized === "false") return false;
    }

    return undefined;
}


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
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ message: "Invalid address id" });
        }

        const address = await getAddressByIdService(id, req.user.id);
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
        const { label, recipient_name, recipient_phone, address_detail, is_default } = req.body
        const parsedIsDefault = normalizeBoolean(is_default);

        if (!label || !recipient_name || !recipient_phone || !address_detail) {
            return res.status(400).json({ message: "Label, recipient name, recipient phone, and address detail are required" })
        }

        if (is_default !== undefined && parsedIsDefault === undefined) {
            return res.status(400).json({ message: "is_default must be a boolean" });
        }

        if (!isValidPhone(recipient_phone)) {
            return res.status(400).json({ message: "Invalid phone number" })
        }

        const data = {
            userId: req.user.id,
            label,
            recipient_name,
            recipient_phone,
            address_detail,
            is_default: parsedIsDefault ?? false
        }

        const result = await createAddressService(data)
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
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ message: "Invalid address id" });
        }

        const { label, recipient_name, recipient_phone, address_detail, is_default } = req.body
        const parsedIsDefault = normalizeBoolean(is_default);

        if (is_default !== undefined && parsedIsDefault === undefined) {
            return res.status(400).json({ message: "is_default must be a boolean" });
        }

        if (recipient_phone !== undefined && !isValidPhone(recipient_phone)) {
            return res.status(400).json({ message: "Invalid phone number" })
        }

        const data = {
            ...(label !== undefined && { label }),
            ...(recipient_name !== undefined && { recipient_name }),
            ...(recipient_phone !== undefined && { recipient_phone }),
            ...(address_detail !== undefined && { address_detail }),
            ...(parsedIsDefault !== undefined && { is_default: parsedIsDefault })
        }

        const result = await updateAddressService(id, req.user.id, data)
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
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ message: "Invalid address id" });
        }

        const result = await deleteAddressService(id, req.user.id)
        return res.status(200).json({
            message: "Successfull deleted address",
            data: result
        })
    } catch (error) {
        next(error)
    }
}
