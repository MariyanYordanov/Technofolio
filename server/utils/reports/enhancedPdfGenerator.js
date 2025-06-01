// server/utils/reports/enhancedPdfGenerator.js
import PdfPrinter from 'pdfmake';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Конфигурация за шрифтове
const fonts = {
    Roboto: {
        normal: path.join(__dirname, '../../assets/fonts/Roboto-Regular.ttf'),
        bold: path.join(__dirname, '../../assets/fonts/Roboto-Medium.ttf'),
        italics: path.join(__dirname, '../../assets/fonts/Roboto-Italic.ttf'),
        bolditalics: path.join(__dirname, '../../assets/fonts/Roboto-MediumItalic.ttf')
    }
};

// Ако шрифтовете не са налични, използвай вградените
const fontsAlternative = {
    Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
    }
};

// Проверка дали шрифтовете съществуват
const checkFonts = () => {
    try {
        fs.accessSync(fonts.Roboto.normal);
        return fonts;
    } catch {
        console.log('⚠️  Custom fonts not found, using built-in fonts');
        return fontsAlternative;
    }
};

export const generateMultiSectionPdfReport = async (studentData, sections) => {
    const printer = new PdfPrinter(checkFonts());

    const { student, absencesData, eventsData, creditsData, achievementsData } = studentData;

    // Създаване на съдържание
    const content = [];

    // Заглавна страница
    content.push(
        {
            text: 'ТЕХНОФОЛИО',
            style: 'title',
            alignment: 'center',
            margin: [0, 50, 0, 20]
        },
        {
            text: 'Индивидуален отчет за ученик',
            style: 'subtitle',
            alignment: 'center',
            margin: [0, 0, 0, 40]
        },
        {
            columns: [
                { width: '*', text: '' },
                {
                    width: 'auto',
                    table: {
                        body: [
                            ['Име:', `${student.firstName} ${student.lastName}`],
                            ['Клас:', student.studentInfo?.grade || 'N/A'],
                            ['Специалност:', student.studentInfo?.specialization || 'N/A'],
                            ['Среден успех:', student.studentInfo?.averageGrade || 'Не е въведен'],
                            ['Дата на отчета:', new Date().toLocaleDateString('bg-BG')]
                        ]
                    },
                    layout: 'noBorders'
                },
                { width: '*', text: '' }
            ]
        },
        { text: '', pageBreak: 'after' }
    );

    // Секция 1: Отсъствия и санкции
    if (sections.includes('absences')) {
        content.push(
            { text: 'Отсъствия и санкции', style: 'sectionHeader' },
            { text: '\n' },
            {
                table: {
                    widths: ['*', 'auto'],
                    body: [
                        ['Извинени отсъствия:', absencesData.excusedAbsences],
                        ['Неизвинени отсъствия:', absencesData.unexcusedAbsences],
                        ['Общо отсъствия:', absencesData.totalAbsences],
                        ['Максимално допустими:', absencesData.maxAllowed],
                        ['Забележки в Школо:', absencesData.schooloRemarks]
                    ]
                },
                layout: 'lightHorizontalLines'
            }
        );

        if (absencesData.activeSanctions && absencesData.activeSanctions.length > 0) {
            content.push(
                { text: '\nАктивни санкции:', style: 'subheader' },
                {
                    table: {
                        headerRows: 1,
                        widths: ['auto', '*', 'auto', 'auto', 'auto'],
                        body: [
                            ['Тип', 'Причина', 'От дата', 'До дата', 'Издадена от'],
                            ...absencesData.activeSanctions.map(s => [
                                s.type,
                                s.reason,
                                s.startDate,
                                s.endDate,
                                s.issuedBy
                            ])
                        ]
                    },
                    layout: 'lightHorizontalLines'
                }
            );
        }

        content.push({ text: '', pageBreak: 'after' });
    }

    // Секция 2: Участия в събития
    if (sections.includes('events') && eventsData && eventsData.length > 0) {
        content.push(
            { text: 'Участия в събития', style: 'sectionHeader' },
            { text: '\n' },
            {
                table: {
                    headerRows: 1,
                    widths: ['*', 'auto', 'auto', 'auto', 'auto'],
                    body: [
                        ['Събитие', 'Дата', 'Място', 'Статус', 'Регистриран'],
                        ...eventsData.map(e => [
                            e.eventTitle,
                            e.eventDate,
                            e.eventLocation,
                            e.status,
                            e.registeredAt
                        ])
                    ]
                },
                layout: 'lightHorizontalLines',
                fontSize: 9
            }
        );

        content.push({ text: '', pageBreak: 'after' });
    }

    // Секция 3: Кредити
    if (sections.includes('credits') && creditsData && creditsData.length > 0) {
        content.push(
            { text: 'Кредити', style: 'sectionHeader' },
            { text: '\n' }
        );

        // Групиране по стълбове
        const creditsByPillar = creditsData.reduce((acc, credit) => {
            if (!acc[credit.pillar]) acc[credit.pillar] = [];
            acc[credit.pillar].push(credit);
            return acc;
        }, {});

        for (const [pillar, credits] of Object.entries(creditsByPillar)) {
            content.push(
                { text: pillar, style: 'subheader' },
                {
                    ul: credits.map(c => ({
                        text: [
                            { text: c.activity, bold: true },
                            ` - ${c.description}`,
                            { text: ` (${c.status === 'validated' ? 'Одобрен' : c.status === 'pending' ? 'Чакащ' : 'Отхвърлен'})`, italics: true }
                        ]
                    }))
                },
                { text: '\n' }
            );
        }

        content.push({ text: '', pageBreak: 'after' });
    }

    // Секция 4: Постижения
    if (sections.includes('achievements') && achievementsData && achievementsData.length > 0) {
        content.push(
            { text: 'Постижения', style: 'sectionHeader' },
            { text: '\n' },
            {
                table: {
                    headerRows: 1,
                    widths: ['*', 'auto', 'auto', 'auto'],
                    body: [
                        ['Постижение', 'Категория', 'Дата', 'Издател'],
                        ...achievementsData.map(a => [
                            a.title,
                            a.category,
                            new Date(a.date).toLocaleDateString('bg-BG'),
                            a.issuer || 'N/A'
                        ])
                    ]
                },
                layout: 'lightHorizontalLines'
            }
        );
    }

    // Дефиниция на документа
    const docDefinition = {
        content,
        styles: {
            title: {
                fontSize: 24,
                bold: true,
                color: '#2c3e50'
            },
            subtitle: {
                fontSize: 18,
                color: '#34495e'
            },
            sectionHeader: {
                fontSize: 16,
                bold: true,
                color: '#2c3e50',
                margin: [0, 0, 0, 10]
            },
            subheader: {
                fontSize: 14,
                bold: true,
                margin: [0, 10, 0, 5]
            },
            tableHeader: {
                bold: true,
                fontSize: 11,
                color: 'black',
                fillColor: '#ecf0f1'
            }
        },
        defaultStyle: {
            font: 'Roboto',
            fontSize: 10
        },
        pageMargins: [40, 60, 40, 60],
        footer: function (currentPage, pageCount) {
            return {
                columns: [
                    { text: 'Технофолио - Училищна система за управление', fontSize: 8, color: 'gray' },
                    { text: `Страница ${currentPage} от ${pageCount}`, alignment: 'right', fontSize: 8, color: 'gray' }
                ],
                margin: [40, 20]
            };
        }
    };

    // Създаване на PDF
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    return new Promise((resolve, reject) => {
        const chunks = [];
        pdfDoc.on('data', chunk => chunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.on('error', reject);
        pdfDoc.end();
    });
};