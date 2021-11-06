let urlOptions = new URLSearchParams(window.location.search);
let countryParameter = urlOptions.get('country') || 'Chile';
let langParameter = urlOptions.get('lang') || 'en';

let allData = [];
let countriesSelection = document.getElementById('countries');

countriesSelection.onchange = () => {
    setup(countriesSelection.value);
}
const loadTranslations = (lang, callback) => {
    axios.get('i18n/' + lang + '.json').then(res => {
        window.translations = res.data;
        document.title = window.translations['title']
        // Loop through all elements
        for (let element of document.querySelectorAll('[translation]')) {
            // Get the value of the attribute 'translation'
            let translation = element.getAttribute('translation');
            // Get the translation from the window.translations object
            let translationValue = window.translations[translation];
            // If the translation exists, replace the content of the element with the translation
            if (translationValue) {
                element.innerText = translationValue;
            }
        }
        if (callback) {
            callback()
        }
    }).catch(err => {
        loadTranslations('en', callback);
    });
}

const setup = (country) => {
    countriesSelection.disabled = true;
    let covidData = {
        yesterdaysData: {
            confirmed: 0,
            deaths: 0,
            recovered: 0
        },

        total: {
            confirmed: 0,
            deaths: 0,
            recovered: 0
        },

        last10Days: [],
    };

    // Get current date with format MM-DD-YYYY
    let now = new Date();
    let yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    let beforeYesterday = new Date(now.getTime() - (48 * 60 * 60 * 1000));
    // Format to YYYY-MM-DD and if the date is less than 10, add a 0 in front
    let yesterdayString = yesterday.getFullYear() + '-' + (yesterday.getMonth() + 1) + '-' + (yesterday.getDate() < 10 ? '0' + yesterday.getDate() : yesterday.getDate());
    let beforeYesterdayString = beforeYesterday.getFullYear() + '-' + (beforeYesterday.getMonth() + 1) + '-' + (beforeYesterday.getDate() < 10 ? '0' + beforeYesterday.getDate() : beforeYesterday.getDate());

    let data = allData.filter(item => item.Country === country)
    window.data = data

    let yesterdaysData = data.find(item => item.Date === yesterdayString);
    let beforeYesterdaysData = data.find(item => item.Date === beforeYesterdayString);

    covidData.total.confirmed = parseInt(yesterdaysData.Confirmed);
    covidData.total.deaths = parseInt(yesterdaysData.Deaths);
    covidData.total.recovered = parseInt(yesterdaysData.Recovered);

    // Store in covidData.yesterdaysData.confirmed, etc the difference between yesterday and before yesterday
    covidData.yesterdaysData.confirmed = parseInt(yesterdaysData.Confirmed) - parseInt(beforeYesterdaysData.Confirmed);
    covidData.yesterdaysData.deaths = parseInt(yesterdaysData.Deaths) - parseInt(beforeYesterdaysData.Deaths);
    covidData.yesterdaysData.recovered = parseInt(yesterdaysData.Recovered) - parseInt(beforeYesterdaysData.Recovered);

    // Get last 10 days data
    for (let i = 1; i < 11; i++) {
        let date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
        let dateBefore = new Date(now.getTime() - ((i + 1) * 24 * 60 * 60 * 1000));
        let dateString = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + (date.getDate() < 10 ? '0' + date.getDate() : date.getDate());
        let dateBeforeString = dateBefore.getFullYear() + '-' + (dateBefore.getMonth() + 1) + '-' + (dateBefore.getDate() < 10 ? '0' + dateBefore.getDate() : dateBefore.getDate());
        let dayData = data.find(item => item.Date === dateString);
        let dayDataBefore = data.find(item => item.Date === dateBeforeString) || { Confirmed: 0, Deaths: 0, Recovered: 0 };
        covidData.last10Days.push({
            label: dateString,
            confirmed: Math.abs(parseInt(dayData.Confirmed) - parseInt(dayDataBefore.Confirmed)),
            cumulativeConfirmed: parseInt(dayData.Confirmed),
            deaths: Math.abs(parseInt(dayData.Deaths) - parseInt(dayDataBefore.Deaths)),
            cumulativeDeaths: parseInt(dayData.Deaths),
            recovered: Math.abs(parseInt(dayData.Recovered) - parseInt(dayDataBefore.Recovered)),
            cumulativeRecovered: parseInt(dayData.Recovered)
        });
    }

    covidData.last10Days = covidData.last10Days.reverse();

    window.covidData = covidData;

    document.getElementById('deaths').innerText = covidData.yesterdaysData.deaths;
    document.getElementById('cases').innerText = covidData.yesterdaysData.confirmed;
    document.getElementById('recovered').innerText = covidData.yesterdaysData.recovered;

    ['cases', 'deaths', 'recovered'].forEach(item => {
        document.getElementById('chart-' + item).remove();
        const chartContainer = document.getElementById('chart-container-' + item);
        const chart = document.createElement('canvas');
        chart.id = 'chart-' + item;
        chartContainer.appendChild(chart);
    })
    window.chartCases = new Chart(document.getElementById('chart-cases').getContext('2d'), {
        data: {
            labels: covidData.last10Days.map(item => item.label),
            datasets: [
                {
                    type: 'line',
                    label: window.translations['cumulative-cases'],
                    data: covidData.last10Days.map(item => item.cumulativeConfirmed),
                    backgroundColor: 'rgba(82, 113, 255, 0.2)',
                    borderColor: 'rgba(82, 113, 255, 1)',
                },
                {
                    type: 'line',
                    label: window.translations['cases-per-day'],
                    data: covidData.last10Days.map(item => item.confirmed),
                    backgroundColor: 'rgba(82, 113, 255, 0.2)',
                    borderColor: 'rgba(82, 113, 255, 1)',
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    window.chartCases.hide(0)

    window.chartDeaths = new Chart(document.getElementById('chart-deaths').getContext('2d'), {
        data: {
            labels: covidData.last10Days.map(item => item.label),
            datasets: [
                {
                    type: 'line',
                    label: window.translations['cumulative-deaths'],
                    data: covidData.last10Days.map(item => item.cumulativeDeaths),
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                },
                {
                    type: 'line',
                    label: window.translations['deaths-per-day'],
                    data: covidData.last10Days.map(item => item.deaths),
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    })
    window.chartDeaths.hide(0)

    window.chartRecovered = new Chart(document.getElementById('chart-recovered').getContext('2d'), {
        data: {
            labels: covidData.last10Days.map(item => item.label),
            datasets: [
                {
                    type: 'line',
                    label: window.translations['cumulative-recovered'],
                    data: covidData.last10Days.map(item => item.cumulativeRecovered),
                    backgroundColor: 'rgba(81, 255, 116, 0.2)',
                    borderColor: 'rgba(81, 255, 116, 1)',
                },
                {
                    type: 'line',
                    label: window.translations['recovered-per-day'],
                    data: covidData.last10Days.map(item => item.recovered),
                    backgroundColor: 'rgba(81, 255, 116, 0.2)',
                    borderColor: 'rgba(81, 255, 116, 1)',
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    })
    window.chartRecovered.hide(0)

    countriesSelection.disabled = false;

    let transmissionLevelCount = (covidData.yesterdaysData.confirmed / 19336724) * 100000;
    const setupTransmissionLevel = (transmissionLevel, color) => {document.getElementById('transmission-level').innerText = window.translations[transmissionLevel].toUpperCase();document.getElementById('transmission-level-color').style.backgroundColor = color;document.getElementById('transmission-level-color').classList.remove('hidden');}
    if(transmissionLevelCount >= 0 && transmissionLevelCount <= 9.99) {
        setupTransmissionLevel('low', '#1d8aff')
    }else if(transmissionLevelCount >= 10 && transmissionLevelCount <= 49.99) {
        setupTransmissionLevel('moderate', '#fff70e')
    }else if(transmissionLevelCount >= 50 && transmissionLevelCount <= 99.99) {
        setupTransmissionLevel('substantial', '#ff7134')
    }else if(transmissionLevelCount >= 100) {
        setupTransmissionLevel('high', '#ff0000')
    }

    document.getElementById('country-' + country).selected = true
};

loadTranslations(langParameter, () => {
    Papa.parse('https://raw.githubusercontent.com/datasets/covid-19/master/data/countries-aggregated.csv', {
        download: true,
        header: true,
        complete: (covidResults, file) => {
            if (covidResults.data) {
                allData = covidResults.data.filter(item => item.Country !== undefined);
                const countries = []
                allData.forEach(item => {
                    if (!countries.includes(item.Country)) {
                        countries.push(item.Country)
                    }
                })
                countries.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item;
                    option.innerText = item;
                    option.id = 'country-' + item;
                    countriesSelection.appendChild(option);
                });
                if(countries.find(item => item === countryParameter)) {
                    setup(countryParameter)
                }
            }
        },
    });
})