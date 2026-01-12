import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  RotateCcw, 
  ChevronDown,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

export interface SessionFilterValues {
  searchTerm: string;
  statusFilter: string;
  languageFilter: string;
  qualityFilter: string;
  interviewerFilter: string;
  dateRange: DateRange | undefined;
}

interface SessionFiltersProps {
  filters: SessionFilterValues;
  onFiltersChange: (filters: SessionFilterValues) => void;
  showQualityFilter?: boolean;
  showInterviewerFilter?: boolean;
  interviewers?: { id: string; name: string; email: string }[];
}

export function SessionFilters({
  filters,
  onFiltersChange,
  showQualityFilter = false,
  showInterviewerFilter = false,
  interviewers = []
}: SessionFiltersProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const updateFilter = <K extends keyof SessionFilterValues>(
    key: K, 
    value: SessionFilterValues[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFiltersChange({
      searchTerm: '',
      statusFilter: 'all',
      languageFilter: 'all',
      qualityFilter: 'all',
      interviewerFilter: 'all',
      dateRange: undefined
    });
  };

  const hasActiveFilters = 
    filters.searchTerm !== '' ||
    filters.statusFilter !== 'all' ||
    filters.languageFilter !== 'all' ||
    filters.qualityFilter !== 'all' ||
    filters.interviewerFilter !== 'all' ||
    filters.dateRange !== undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by respondent code..."
            value={filters.searchTerm}
            onChange={(e) => updateFilter('searchTerm', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap gap-3">
          {/* Status Filter */}
          <Select 
            value={filters.statusFilter} 
            onValueChange={(v) => updateFilter('statusFilter', v)}
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="abandoned">Abandoned</SelectItem>
            </SelectContent>
          </Select>

          {/* Language Filter */}
          <Select 
            value={filters.languageFilter} 
            onValueChange={(v) => updateFilter('languageFilter', v)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="zh">中文</SelectItem>
              <SelectItem value="id">Bahasa Indonesia</SelectItem>
              <SelectItem value="ms">Bahasa Melayu</SelectItem>
            </SelectContent>
          </Select>

          {/* Quality Filter */}
          {showQualityFilter && (
            <Select 
              value={filters.qualityFilter} 
              onValueChange={(v) => updateFilter('qualityFilter', v)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Quality</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Interviewer Filter */}
          {showInterviewerFilter && interviewers.length > 0 && (
            <Select 
              value={filters.interviewerFilter} 
              onValueChange={(v) => updateFilter('interviewerFilter', v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Interviewer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Interviewers</SelectItem>
                {interviewers.map((interviewer) => (
                  <SelectItem key={interviewer.id} value={interviewer.id}>
                    {interviewer.name || interviewer.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Date Range Picker */}
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !filters.dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange?.from ? (
                  filters.dateRange.to ? (
                    <>
                      {format(filters.dateRange.from, "MMM dd")} -{" "}
                      {format(filters.dateRange.to, "MMM dd, yyyy")}
                    </>
                  ) : (
                    format(filters.dateRange.from, "MMM dd, yyyy")
                  )
                ) : (
                  "Select date range"
                )}
                {filters.dateRange && (
                  <X 
                    className="ml-auto h-4 w-4 hover:text-destructive" 
                    onClick={(e) => {
                      e.stopPropagation();
                      updateFilter('dateRange', undefined);
                    }}
                  />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={filters.dateRange?.from}
                selected={filters.dateRange}
                onSelect={(range) => updateFilter('dateRange', range)}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Reset Button */}
          {hasActiveFilters && (
            <Button variant="outline" onClick={resetFilters} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.searchTerm && (
            <Button
              variant="secondary"
              size="sm"
              className="h-7 gap-1"
              onClick={() => updateFilter('searchTerm', '')}
            >
              Search: {filters.searchTerm}
              <X className="h-3 w-3" />
            </Button>
          )}
          {filters.statusFilter !== 'all' && (
            <Button
              variant="secondary"
              size="sm"
              className="h-7 gap-1"
              onClick={() => updateFilter('statusFilter', 'all')}
            >
              Status: {filters.statusFilter}
              <X className="h-3 w-3" />
            </Button>
          )}
          {filters.languageFilter !== 'all' && (
            <Button
              variant="secondary"
              size="sm"
              className="h-7 gap-1"
              onClick={() => updateFilter('languageFilter', 'all')}
            >
              Language: {filters.languageFilter}
              <X className="h-3 w-3" />
            </Button>
          )}
          {filters.qualityFilter !== 'all' && showQualityFilter && (
            <Button
              variant="secondary"
              size="sm"
              className="h-7 gap-1"
              onClick={() => updateFilter('qualityFilter', 'all')}
            >
              Quality: {filters.qualityFilter}
              <X className="h-3 w-3" />
            </Button>
          )}
          {filters.interviewerFilter !== 'all' && showInterviewerFilter && (
            <Button
              variant="secondary"
              size="sm"
              className="h-7 gap-1"
              onClick={() => updateFilter('interviewerFilter', 'all')}
            >
              Interviewer: {interviewers.find(i => i.id === filters.interviewerFilter)?.name || 'Selected'}
              <X className="h-3 w-3" />
            </Button>
          )}
          {filters.dateRange && (
            <Button
              variant="secondary"
              size="sm"
              className="h-7 gap-1"
              onClick={() => updateFilter('dateRange', undefined)}
            >
              Date: {format(filters.dateRange.from!, 'MMM dd')} - {filters.dateRange.to ? format(filters.dateRange.to, 'MMM dd') : '...'}
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
