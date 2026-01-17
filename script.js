document.addEventListener('DOMContentLoaded', function() {
    const inputKwh = document.getElementById('avg-consumption');
    
    // Output Elements
    const outKwp = document.getElementById('out-kwp');
    const outSavingsMonth = document.getElementById('out-savings-month');
    const outSavingsYear = document.getElementById('out-savings-year');
    const outCo2 = document.getElementById('out-co2');

    // Constants
    const PRICE_PER_KWH = 13.09;
    const YIELD_FACTOR = 1450; // kWh/kWp/year approx in DR
    const CO2_FACTOR = 0.5; // kg CO2 per kWh approx

    function calculate() {
        const consumption = parseFloat(inputKwh.value);
        
        if (isNaN(consumption) || consumption <= 0) {
            // Reset to zero or placeholders if invalid
            outKwp.textContent = '0 kWp';
            outSavingsMonth.textContent = 'RD$ 0';
            outSavingsYear.textContent = 'RD$ 0';
            outCo2.textContent = '0 kg';
            return;
        }

        // Logic requested by user:
        // 1. kWp needed: (Monthly Avg * 12) / 1450
        const annualConsumption = consumption * 12;
        const systemSize = annualConsumption / YIELD_FACTOR;

        // 2. Monthly Savings: Monthly Avg * 13.09
        const monthlySavings = consumption * PRICE_PER_KWH;

        // 3. Annual Savings: Monthly Savings * 12
        const annualSavings = monthlySavings * 12;

        // 4. CO2 avoided (Annual)
        const co2Avoided = annualConsumption * CO2_FACTOR;

        // Update UI with formatted numbers
        outKwp.textContent = systemSize.toFixed(2) + ' kWp';
        outSavingsMonth.textContent = formatCurrency(monthlySavings);
        outSavingsYear.textContent = formatCurrency(annualSavings);
        outCo2.textContent = Math.round(co2Avoided).toLocaleString() + ' kg';
    }

    function formatCurrency(amount) {
        return 'RD$ ' + amount.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // Event listener for real-time calculation
    inputKwh.addEventListener('input', calculate);
});
