export default function ReceiptTemplate({ data }) {
    // This is a UI preview of the receipt (optional)
    return (
        <div className="bg-white p-8 text-black max-w-2xl mx-auto shadow-xl border border-gray-200">
            <div className="text-center border-b-2 border-black pb-4 mb-6">
                <h1 className="text-2xl font-bold">AGNEL CHARITIES</h1>
                <h2 className="text-xl font-bold text-gray-800">FR. C. RODRIGUES INSTITUTE OF TECHNOLOGY</h2>
                <p className="text-sm mt-2 text-gray-600">Sector 9-A, Vashi, Navi Mumbai - 400703</p>
            </div>

            <div className="flex justify-between items-start mb-8">
                <div>
                    <h3 className="text-lg font-bold mb-2">Student Details</h3>
                    <p><strong>Name:</strong> {data.name}</p>
                    <p><strong>Roll No:</strong> {data.rollNo}</p>
                    <p><strong>Branch:</strong> {data.branch}</p>
                    <p><strong>Semester:</strong> {data.semester}</p>
                </div>
                <div className="text-right">
                    <h3 className="text-lg font-bold mb-2">Receipt Info</h3>
                    <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                    <p><strong>Ref Code:</strong> {data.transactionId}</p>
                </div>
            </div>

            <div className="mb-8">
                <table className="w-full border-collapse border border-black">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-black p-2 text-left">Event</th>
                            <th className="border border-black p-2 text-left">Type</th>
                            <th className="border border-black p-2 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border border-black p-2">{data.eventName}</td>
                            <td className="border border-black p-2 capitalize">{data.eventType}</td>
                            <td className="border border-black p-2 text-right">₹{data.amount}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-end mt-12 pt-8">
                <div className="text-green-700 font-bold border-2 border-green-700 p-2 rounded rotate-[-10deg]">
                    PAID & VERIFIED
                </div>
                <div className="text-center">
                    <div className="h-10 border-b border-black w-40 mb-2"></div>
                    <p>Authorized Signature</p>
                </div>
            </div>
        </div>
    );
}
