import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MoreVertical, MessageSquare, User } from "lucide-react";
import api from "../../services/api";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from  '../../components/ui/badge'

interface Student {
  name: string;
  totalProgress: number;
  userToken: string;
}

export default function StudentList() {
  const [studentsData, setStudentsData] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you should fetch the list of tokens/ids from an endpoint first
    // For now, we are adapting your logic of reading from sessionStorage
    const storedList = JSON.parse(sessionStorage.getItem("studentList") || "[]");

    const fetchDetails = async () => {
      try {
        const details = await Promise.all(
          storedList.map(async (item: any) => {
            const token = item.userToken.replace(/"/g, "");
            const res = await api.get(`/fetchAll?token=${token}`);
            return { ...res.data, userToken: token };
          })
        );
        setStudentsData(details);
      } catch (error) {
        console.error("Error fetching students", error);
      } finally {
        setLoading(false);
      }
    };

    if (storedList.length > 0) fetchDetails();
    else setLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-background p-8 flex flex-col items-center">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6" /> Student Directory
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
          </Button>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="text-center py-10">Loading student data...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsData.map((student, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-semibold text-primary">{student.name}</TableCell>
                    <TableCell>
                      <Badge variant={student.totalProgress > 50 ? "default" : "secondary"}>
                        {student.totalProgress}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}