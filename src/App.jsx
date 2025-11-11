import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import 'chart.js/auto';

export default function App() {
  const [data, setData] = useState([]);
  const [file, setFile] = useState(null);

  const fetchData = async () => {
    const res = await axios.get("http://localhost:4000/summary");
    setData(res.data);
  };
  useEffect(() => { fetchData(); }, []);

  const upload = async () => {
    const form = new FormData();
    form.append("file", file);
    await axios.post("http://localhost:4000/upload", form);
    fetchData();
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>AWS Cost Analyzer</h2>
      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <button onClick={upload}>Upload</button>
      <Bar
        data={{
          labels: data.map(d => d._id),
          datasets: [{ label: "Cost ($)", data: data.map(d => d.cost) }]
        }}
      />
    </div>
  );
}
