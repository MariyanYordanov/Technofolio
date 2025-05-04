// server/utils/dbUtils.js
import { AppError } from './AppError.js';

export async function findDocumentOrFail(Model, id, message = null) {
    const document = await Model.findById(id);
    if (!document) {
        throw new AppError(message || 'Документът не е намерен', 404);
    }
    return document;
}

export async function findDocumentByFieldOrFail(Model, field, value, message = null) {
    const document = await Model.findOne({ [field]: value });
    if (!document) {
        throw new AppError(message || 'Документът не е намерен', 404);
    }
    return document;
}