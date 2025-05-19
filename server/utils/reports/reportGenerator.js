// server/utils/reports/reportGenerator.js
import Excel from 'exceljs';
import PdfPrinter from 'pdfmake';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Конфигурация за шрифтове за PDF
const fonts = {
    Roboto: {
        normal: path.join(__dirname, '../../assets/fonts/Roboto-Regular.ttf'),
        bold: path.join(__dirname, '../../assets/fonts/Roboto-Medium.ttf'),
        italics: path.join(__dirname, '../../assets/fonts/Roboto-Italic.ttf'),
        bolditalics: path.join(__dirname, '../../assets/fonts/Roboto-MediumItalic.ttf')
    }
};

// Функция за генериране на Excel отчет
export const generateExcelReport = async (data, headers, title) => {
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet(title);

    // Добавяне на заглавия
    worksheet.columns = headers.map(header => ({
        header: header.label,
        key: header.key,
        width: header.width || 20
    }));

    // Стилизиране на заглавията
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Добавяне на данни
    data.forEach(item => {
        const row = {};
        headers.forEach(header => {
            row[header.key] = item[header.key];
        });
        worksheet.addRow(row);
    });

    // Създаване на буфер
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
};

// Функция за генериране на PDF отчет
export const generatePdfReport = async (data, columns, title, subtitle = '') => {
    const printer = new PdfPrinter(fonts);

    // Създаване на колони за таблицата
    const tableColumns = columns.map(column => ({
        text: column.label,
        style: 'tableHeader'
    }));

    // Създаване на редове за таблицата
    const tableBody = data.map(item => {
        return columns.map(column => ({
            text: item[column.key] !== undefined ? String(item[column.key]) : '',
            style: 'tableCell'
        }));
    });

    // Създаване на дефиниция за PDF
    const docDefinition = {
        content: [
            { text: title, style: 'header' },
            subtitle ? { text: subtitle, style: 'subheader' } : {},
            {
                table: {
                    headerRows: 1,
                    widths: columns.map(column => column.width || '*'),
                    body: [tableColumns, ...tableBody]
                },
                layout: {
                    hLineWidth: function (i, node) {
                        return i === 0 || i === node.table.body.length ? 2 : 1;
                    },
                    vLineWidth: function (i, node) {
                        return i === 0 || i === node.table.widths.length ? 2 : 1;
                    },
                    hLineColor: function (i, node) {
                        return i === 0 || i === node.table.body.length ? 'black' : 'gray';
                    },
                    vLineColor: function (i, node) {
                        return i === 0 || i === node.table.widths.length ? 'black' : 'gray';
                    }
                }
            }
        ],
        styles: {
            header: {
                fontSize: 18,
                bold: true,
                margin: [0, 0, 0, 10]
            },
            subheader: {
                fontSize: 14,
                bold: true,
                margin: [0, 0, 0, 10]
            },
            tableHeader: {
                bold: true,
                fontSize: 12,
                color: 'black',
                alignment: 'center'
            },
            tableCell: {
                fontSize: 10,
                margin: [0, 5, 0, 5]
            }
        },
        defaultStyle: {
            font: 'Roboto'
        },
        footer: function (currentPage, pageCount) {
            return {
                text: `Страница ${currentPage} от ${pageCount}`,
                alignment: 'center',
                margin: [0, 10, 0, 0]
            };
        },
        info: {
            title: title,
            author: 'Технофолио',
            subject: subtitle,
            creator: 'Технофолио'
        }
    };

    // Създаване на PDF документ
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    return new Promise((resolve, reject) => {
        const chunks = [];
        pdfDoc.on('data', chunk => chunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.on('error', reject);
        pdfDoc.end();
    });
};

// Помощна функция за форматиране на дата
export const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
};