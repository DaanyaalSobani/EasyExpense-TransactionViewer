import React, { useState, useEffect } from 'react';
import { Download, GripVertical } from 'lucide-react';
import Papa from 'papaparse';
import _ from 'lodash';

const PrintableTransactions = () => {
  const [data, setData] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => {

    
    const loadData = async () => {
      try {
        const [expensesResponse, incomesResponse] = await Promise.all([
          fetch('/Expenses.csv'),
          fetch('/Incomes.csv')
        ]);
    
        const [expensesText, incomesText] = await Promise.all([
          expensesResponse.text(),
          incomesResponse.text()
        ]);
        
        const parseOptions = { header: true, dynamicTyping: true, skipEmptyLines: true };
        const expensesData = Papa.parse(expensesText, parseOptions).data;
        const incomesData = Papa.parse(incomesText, parseOptions).data;
        
        // Rest of your data processing remains the same
        expensesData.forEach(row => row.Type = 'Expense');
        incomesData.forEach(row => row.Type = 'Income');
        
        const merged = _.orderBy([...expensesData, ...incomesData], ['Date'], ['asc'])
          .map((row, index) => ({ ...row, id: index }));
    
        setData(merged);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null) return;
    
    const draggedDate = data[draggedItem].Date;
    const targetDate = data[index].Date;
    
    if (draggedDate === targetDate) {
      const newData = [...data];
      const [removed] = newData.splice(draggedItem, 1);
      newData.splice(index, 0, removed);
      setData(newData);
      setDraggedItem(index);
    }
  };

  const calculateBalance = (index) => {
    return data.slice(0, index + 1).reduce((acc, row) => {
      return acc + (row.Type === 'Income' ? row.Total : -row.Total);
    }, 0);
  };

  const getDailyTotals = (date) => {
    const sameDate = data.filter(row => row.Date === date);
    const dailyIncome = sameDate.reduce((acc, row) => acc + (row.Type === 'Income' ? row.Total : 0), 0);
    const dailyExpense = sameDate.reduce((acc, row) => acc + (row.Type === 'Expense' ? row.Total : 0), 0);
    const dailyBalance = dailyIncome - dailyExpense;
    return { dailyIncome, dailyExpense, dailyBalance };
  };

  const renderAmount = (amount, isTotal = false) => {
    const className = `p-4 text-right ${!isTotal ? (amount >= 0 ? 'text-green-600' : 'text-red-600') : ''}`;
    return <td className={className}>{amount.toLocaleString()}</td>;
  };

  const renderDailyRow = (date, endBalance) => (
    <tr className="bg-gray-100 border-t-2 daily-summary">
      <td colSpan="6" className="p-4 font-medium">Daily Summary - {date}</td>
      {renderAmount(endBalance)}
      {renderAmount(getDailyTotals(date).dailyIncome)}
      {renderAmount(getDailyTotals(date).dailyExpense)}
      {renderAmount(getDailyTotals(date).dailyBalance)}
    </tr>
  );

  const groupedRows = () => {
    let rows = [];
    let currentDate = null;
    let lastBalance = 0;

    data.forEach((row, index) => {
      if (currentDate && currentDate !== row.Date) {
        rows.push(renderDailyRow(currentDate, lastBalance));
      }
      currentDate = row.Date;
      lastBalance = calculateBalance(index);
      
      rows.push(
        <tr 
          key={row.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          className="bg-white hover:bg-gray-50 transaction-group"
        >
          <td className="p-2">
            <GripVertical className="w-4 h-4 cursor-move text-gray-400" />
          </td>
          <td className="p-4">{row.Date}</td>
          <td className={`p-4 ${row.Type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
            {row.Type}
          </td>
          <td className="p-4">{row.Description || (row.Type === 'Income' ? row.Client : row.Vendor)}</td>
          <td className="p-4">{row.Category}</td>
          {renderAmount(row.Total, true)}
          {renderAmount(lastBalance)}
          <td className="p-4"></td>
          <td className="p-4"></td>
          <td className="p-4"></td>
        </tr>
      );
    });

    // Add summary for the last date
    if (currentDate && data.length > 0) {
      rows.push(renderDailyRow(currentDate, lastBalance));
    }

    return rows;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <button 
        onClick={handlePrint}
        className="mb-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        <Download size={16} />
        Download PDF
      </button>
      
      {/* <style>{`
        @media print {
          button { display: none; }
          table { break-inside: auto; }
          tr { break-inside: avoid; }
          @page { size: landscape; }
        }
      `}</style> */}
      

      <div className="w-full">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100 z-10" style={{ position: 'sticky', top: 0 }}>
            <tr className="bg-gray-100">
              <th className="w-8"></th>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">Type</th>
              <th className="p-4 text-left">Description</th>
              <th className="p-4 text-left">Category</th>
              <th className="p-4 text-right">Total</th>
              <th className="p-4 text-right">Running Balance</th>
              <th className="p-4 text-right">Daily Income</th>
              <th className="p-4 text-right">Daily Expense</th>
              <th className="p-4 text-right">Daily Balance</th>
            </tr>
          </thead>
          <tbody>
            {groupedRows()}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrintableTransactions;